# 📚 Librería Digital
Proyecto Unidad 3 – Desarrollo Web Integral (UTSLRC). Sitio con Inicio, Registro validado y Catálogo con la API de Open Library.

## Ejecutar
1. Requiere Node.js 20.6 o superior (sin `npm install`, no usa dependencias).
2. Copia `.env.example` a `.env` y escribe tu correo en `OPENLIBRARY_CONTACT` (Open Library es gratuita y no usa clave, solo pide identificarte).
3. `npm start` y abre http://localhost:3000

## Seguridad aplicada
- Datos de configuración en `.env` (en `.gitignore`), usados solo en el servidor (proxy `/api/libros`).
- Validación en cliente **y** servidor; contraseñas con hash scrypt + sal.
- Rate limiting, límite de tamaño del body, cabeceras de seguridad y CSP.
- Salidas escapadas contra XSS; protección contra path traversal.
# lumina
