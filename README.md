# Ruleta de personas

Proyecto simple de ruleta donde los participantes inician sesión con un PIN, giran una vez y se asignan objetivos. Incluye un panel de administrador (usuario `Angel`, clave `678`) para ver y editar PINs y estados localmente.

## Deploy en Netlify
1. Ve a https://app.netlify.com/ y crea una cuenta o inicia sesión.
2. Haz clic en **Add new site → Import an existing project**.
3. Conecta tu cuenta de GitHub y autoriza a Netlify si es necesario.
4. Selecciona el repositorio `Am0103/ruleta` y la rama `main`.
5. En **Build settings** deja la configuración por defecto (no hay comando de build) y `Publish directory` deja `.`.
6. Haz clic en **Deploy site**. Netlify construirá y publicará el sitio y, en adelante, cada push a `main` desplegará automáticamente.

## Notas sobre datos de admin
- Actualmente los PINs y estados (quién giró y quién fue elegido) se guardan en `localStorage` del navegador. Esto significa que los cambios hechos desde el panel admin se almacenan sólo en el navegador donde se hicieron.
- Para sincronizar datos entre todos los navegadores debes usar un backend o un servicio BaaS (Firebase, Supabase) o bien implementar export/import JSON manual desde el panel admin.

Si quieres, puedo agregar ahora una función de exportar/importar estado (JSON) en el `#adminPanel`, o implementar persistencia central con Firebase/Supabase. Dime qué prefieres.

## Cómo ejecutar localmente
1. Sirve la carpeta con un servidor HTTP simple. Por ejemplo:

```bash
python -m http.server 8000
# luego abre http://127.0.0.1:8000
```

Autor: Angel — © 2026
