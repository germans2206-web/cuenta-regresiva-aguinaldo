# Seguridad

Este proyecto es un sitio 100 % estático (HTML, CSS y JavaScript), sin servidor, base de datos, formularios ni cuentas de usuario.

- No contiene credenciales: el despliegue lo hace Cloudflare Pages conectado a GitHub, sin tokens en el repositorio.
- Todos los recursos (fuentes, scripts, imágenes) se sirven desde el propio dominio; no se cargan terceros.
- Cabeceras de seguridad en `public/_headers`: Content-Security-Policy estricta, X-Frame-Options, HSTS, Permissions-Policy, nosniff.

Si encontrás un problema de seguridad, avisá abriendo un *issue* (sin incluir datos sensibles) o por mensaje privado al autor.
