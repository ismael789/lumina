# Lúmina

Biblioteca digital con catálogo de libros, buscador, registro seguro, videos educativos y clima actual.

## Ejecutar

1. Requiere Node.js 20.6 o superior. No usa dependencias externas de npm.
2. Copia `.env.example` como `.env`.
3. Coloca tu clave gratuita de OpenWeatherMap en `OPENWEATHER_API_KEY`.
4. Personaliza `OPENWEATHER_CITY` si lo deseas.
5. Ejecuta `npm start` y abre http://localhost:3000.

## APIs externas

- Open Library: catálogo de libros y portadas mediante `/api/libros`.
- OpenWeatherMap: clima actual mediante `/api/clima`; la clave se lee solo desde `.env` y nunca se envía al navegador.

## Seguridad aplicada

- `.env` está incluido en `.gitignore` y no se sube a GitHub.
- Validación en cliente y servidor; contraseñas con hash scrypt y sal.
- Rate limiting, límite de tamaño del body, cabeceras de seguridad y CSP.
- Salidas escapadas contra XSS y protección contra path traversal.
