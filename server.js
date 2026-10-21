// Servidor sin dependencias externas (solo Node >= 20.6)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

try { process.loadEnvFile(); } catch { console.warn('No se encontró .env (copia .env.example)'); }
const PORT = process.env.PORT || 3000;
const CONTACTO = process.env.OPENLIBRARY_CONTACT || 'sin-contacto'; // se lee de .env, nunca va en el código
const WEATHER_KEY = process.env.OPENWEATHER_API_KEY || '';
const WEATHER_CITY = process.env.OPENWEATHER_CITY || 'Hermosillo,MX';
const PUBLIC = path.join(__dirname, 'public');
const DB = path.join(__dirname, 'data', 'usuarios.json');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

// ---- Seguridad: cabeceras y límite de intentos (rate limiting) ----
const HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-src https://www.youtube.com https://www.youtube-nocookie.com",
};
const hits = new Map();
function limitado(ip) {
  const now = Date.now();
  const h = (hits.get(ip) || []).filter(t => now - t < 60000);
  h.push(now); hits.set(ip, h);
  return h.length > 30;
}

// ---- Validación en el servidor (nunca confiar solo en el navegador) ----
function validar(d) {
  const e = {};
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,60}$/.test(d.nombre || '')) e.nombre = 'Solo letras, de 3 a 60 caracteres.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.correo || '') || d.correo.length > 100) e.correo = 'Correo no válido.';
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/.test(d.password || '')) e.password = 'Mínimo 8 caracteres con mayúscula, minúscula y número.';
  if (d.password !== d.confirmar) e.confirmar = 'Las contraseñas no coinciden.';
  if (d.acepto !== true) e.acepto = 'Debes aceptar el aviso de privacidad.';
  return e;
}

function leerBody(req) {
  return new Promise((ok, fail) => {
    let s = '';
    req.on('data', c => { s += c; if (s.length > 10000) { req.destroy(); fail(); } });
    req.on('end', () => { try { ok(JSON.parse(s)); } catch { fail(); } });
  });
}
const json = (res, code, obj) => { res.writeHead(code, { ...HEADERS, 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/') && limitado(req.socket.remoteAddress)) return json(res, 429, { error: 'Demasiadas solicitudes.' });

  // API propia 1: proxy a Open Library (gratuita; se identifica con un contacto desde .env)
  if (req.method === 'GET' && url.pathname === '/api/libros') {
    const q = (url.searchParams.get('q') || 'programación').slice(0, 80);
    const api = new URL('https://openlibrary.org/search.json');
    api.searchParams.set('q', q); api.searchParams.set('limit', '12'); api.searchParams.set('lang', 'es');
    api.searchParams.set('fields', 'key,title,author_name,first_publish_year,edition_count,cover_i');
    try {
      const r = await fetch(api, { headers: { 'User-Agent': 'LibreriaDigital/1.0 (' + CONTACTO + ')' }, signal: AbortSignal.timeout(10000) });
      if (!r.ok) return json(res, 502, { error: 'La API externa respondió con error ' + r.status });
      const d = await r.json();
      const libros = (d.docs || []).map(i => ({
        titulo: i.title || 'Sin título', autores: i.author_name || [],
        descripcion: [i.first_publish_year && 'Primera publicación: ' + i.first_publish_year, i.edition_count && i.edition_count + ' ediciones'].filter(Boolean).join(' · '),
        portada: i.cover_i ? 'https://covers.openlibrary.org/b/id/' + i.cover_i + '-M.jpg' : '',
        enlace: 'https://openlibrary.org' + (String(i.key).startsWith('/') ? i.key : '/works/' + i.key),
      }));
      return json(res, 200, { libros });
    } catch { return json(res, 502, { error: 'No se pudo conectar con la API.' }); }
  }

  // API propia 2: clima actual con OpenWeatherMap; la clave nunca llega al navegador
  if (req.method === 'GET' && url.pathname === '/api/clima') {
    if (!WEATHER_KEY) return json(res, 503, { error: 'Configura OPENWEATHER_API_KEY en tu archivo .env.' });
    const ciudad = (url.searchParams.get('ciudad') || WEATHER_CITY).slice(0, 80);
    const api = new URL('https://api.openweathermap.org/data/2.5/weather');
    api.searchParams.set('q', ciudad);
    api.searchParams.set('appid', WEATHER_KEY);
    api.searchParams.set('units', 'metric');
    api.searchParams.set('lang', 'es');
    try {
      const r = await fetch(api, { signal: AbortSignal.timeout(10000) });
      const d = await r.json();
      if (!r.ok) return json(res, r.status === 404 ? 404 : 502, { error: d.message || 'No se pudo consultar el clima.' });
      return json(res, 200, {
        ciudad: d.name, pais: d.sys?.country || '', temperatura: Math.round(d.main.temp),
        sensacion: Math.round(d.main.feels_like), descripcion: d.weather?.[0]?.description || 'Sin descripción',
        humedad: d.main.humidity, viento: Math.round((d.wind?.speed || 0) * 3.6), icono: d.weather?.[0]?.icon || '01d',
      });
    } catch { return json(res, 502, { error: 'No se pudo conectar con la API del clima.' }); }
  }

  // API propia 3: registro con validación y contraseña con hash (scrypt + sal)
  if (req.method === 'POST' && url.pathname === '/api/registro') {
    let d; try { d = await leerBody(req); } catch { return json(res, 400, { error: 'Solicitud inválida.' }); }
    const errores = validar(d);
    if (Object.keys(errores).length) return json(res, 400, { errores });
    fs.mkdirSync(path.dirname(DB), { recursive: true });
    const usuarios = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB)) : [];
    const correo = d.correo.toLowerCase();
    if (usuarios.some(u => u.correo === correo)) return json(res, 409, { errores: { correo: 'Ese correo ya está registrado.' } });
    const sal = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(d.password, sal, 64).toString('hex');
    usuarios.push({ nombre: d.nombre.trim(), correo, sal, hash, creado: new Date().toISOString() });
    fs.writeFileSync(DB, JSON.stringify(usuarios, null, 2));
    return json(res, 201, { mensaje: 'Cuenta creada correctamente.' });
  }

  // Archivos estáticos (con protección contra path traversal)
  const archivo = url.pathname === '/' ? '/index.html' : url.pathname;
  const ruta = path.normalize(path.join(PUBLIC, archivo));
  if (!ruta.startsWith(PUBLIC) || !fs.existsSync(ruta) || !fs.statSync(ruta).isFile()) {
    res.writeHead(404, HEADERS); return res.end('No encontrado');
  }
  res.writeHead(200, { ...HEADERS, 'Content-Type': MIME[path.extname(ruta)] || 'application/octet-stream' });
  fs.createReadStream(ruta).pipe(res);
}).listen(PORT, () => console.log('Librería Digital en http://localhost:' + PORT));
