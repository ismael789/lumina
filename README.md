# Lúmina

Biblioteca digital con catálogo de libros, buscador, registro seguro, videos educativos 

## Ejecutar

1. Requiere Node.js 20.6 o superior. No usa dependencias externas de npm.
2. Copia `.env.example` como `.env`.
3. Ejecuta `npm start` y abre http://localhost:3000

## Seguridad aplicada

- `.env` está incluido en `.gitignore` y no se sube a GitHub.
- Validación en cliente y servidor; contraseñas con hash scrypt y sal.
- Rate limiting, límite de tamaño del body, cabeceras de seguridad y CSP.
- Salidas escapadas contra XSS y protección contra path traversal.
