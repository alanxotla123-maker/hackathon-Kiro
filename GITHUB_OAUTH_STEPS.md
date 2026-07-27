# Pasos para finalizar la integracion de GitHub OAuth 2.0

Este documento describe los pasos exactos necesarios para completar la implementacion de la autenticacion con GitHub, conectando el frontend ya preparado con tu futuro backend.

## 1. Configuracion en GitHub

1. Ingresa a tu cuenta de GitHub.
2. Ve a **Settings** > **Developer Settings** > **OAuth Apps**.
3. Haz clic en **New OAuth App**.
4. Completa el formulario:
   - **Application name**: (El nombre de tu aplicacion)
   - **Homepage URL**: (URL principal de tu app, por ejemplo, http://localhost:5173)
   - **Authorization callback URL**: Debe coincidir exactamente con la definida en el frontend. Usaremos: `http://localhost:5173/api/auth/github/callback`
5. Registra la aplicacion.
6. Copia el **Client ID** generado.
7. Haz clic en **Generate a new client secret** y copia el valor generado (solo se mostrara una vez).

## 2. Configuracion de Variables de Entorno

1. En el frontend, crea un archivo `.env` basandote en `.env.example`.
2. Asigna el **Client ID** a la variable `VITE_GITHUB_CLIENT_ID`.
3. En el backend, crea tu propio archivo `.env` o configuracion similar, y añade tanto el **Client ID** como el **Client Secret** que obtuviste de GitHub. NUNCA coloques el Client Secret en el frontend.

## 3. Implementacion del Backend (Ruta de Intercambio)

En tu backend (por ejemplo, en Node.js/Express), deberas crear un endpoint que reciba el codigo temporal proporcionado por el frontend y lo intercambie por los datos del usuario.

El endpoint sugerido es `POST /api/auth/github`. El flujo debe ser el siguiente:

1. **Recibir el codigo:** Extraer `code` del cuerpo de la peticion (body).
2. **Obtener Access Token:** Hacer una peticion POST a `https://github.com/login/oauth/access_token` con los siguientes parametros:
   - `client_id`
   - `client_secret`
   - `code`
   *(Asegurate de enviar el header `Accept: application/json` para recibir la respuesta en formato JSON).*
3. **Obtener datos del usuario:** Una vez recibido el `access_token`, hacer una peticion GET a `https://api.github.com/user` enviando en los headers: `Authorization: Bearer <access_token>`.
4. **Gestionar usuario local:** Con los datos recibidos (ID de GitHub, nombre, email, etc.):
   - Verifica si el usuario ya existe en tu base de datos.
   - Si no existe, crealo.
   - Si existe, actualiza su informacion si es necesario.
5. **Generar sesion:** Genera tu propio token (ej. JWT) o cookie de sesion y devuelvelo al frontend junto con los datos basicos del usuario.

## 4. Finalizacion en el Frontend

Una vez que el backend este listo y exponga el endpoint mencionado:

1. Abre el archivo `src/components/Auth/GithubCallback.tsx` en el frontend.
2. Elimina el bloque de codigo etiquetado como "SIMULACION".
3. Descomenta el bloque de la peticion `fetch`.
4. Ajusta la logica de manejo de la respuesta (`response.json()`) para procesar el token JWT o los datos del usuario que tu backend devuelva.
5. Guarda el token en `localStorage` (o donde gestiones tus sesiones) y redirige a la pantalla principal.
