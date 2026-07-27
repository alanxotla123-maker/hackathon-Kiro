# Configuracion de Google Auth (OAuth 2.0)

Este documento detalla los pasos restantes y necesarios para completar la integracion completa de inicio de sesion con Google en la aplicacion.

## Fase 1 (Completada): Interfaz de Usuario y Redireccion

Se han realizado las siguientes implementaciones:
1.  Boton de "Continuar con Google" agregado al componente de Login siguiendo las guias de diseno de Google.
2.  Logica para redirigir al usuario al servidor de autorizacion de Google (`https://accounts.google.com/o/oauth2/v2/auth`).
3.  Uso de las variables de entorno `VITE_GOOGLE_CLIENT_ID` y `VITE_GOOGLE_REDIRECT_URI`.

## Fase 2: Pasos Necesarios en Google Cloud Console

Para que el boton funcione correctamente, debes configurar tu aplicacion en Google Cloud:

1.  Ve a la consola de Google Cloud (https://console.cloud.google.com/).
2.  Crea un nuevo proyecto o selecciona uno existente.
3.  Navega a "APIs & Services" > "OAuth consent screen" y configura la pantalla de consentimiento. Necesitaras proporcionar el nombre de la aplicacion y un correo de soporte.
4.  Navega a "APIs & Services" > "Credentials".
5.  Haz clic en "Create Credentials" y selecciona "OAuth client ID".
6.  Selecciona "Web application" como el tipo de aplicacion.
7.  En "Authorized JavaScript origins", agrega el origen de tu aplicacion frontend local (ejemplo: `http://localhost:5173`).
8.  En "Authorized redirect URIs", agrega exactamente la URL de callback que tienes en tu `.env` (ejemplo: `http://localhost:5173/api/auth/google/callback`).
9.  Una vez creado, obtendras un "Client ID" y un "Client Secret".

Asegurate de colocar el Client ID en tu archivo `.env`:
`VITE_GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com`

## Fase 3: Manejo del Callback (Frontend)

Cuando el usuario aprueba los permisos en Google, Google lo redirigira a la URL que especificaste en `redirect_uri` (ejemplo: `/api/auth/google/callback`), anadiendo un parametro `code` a la URL.

Lo que falta por implementar en el Frontend:
1.  Crear una ruta en React (ejemplo: `<Route path="/api/auth/google/callback" element={<GoogleCallback />} />`) para capturar esta redireccion.
2.  En el componente `GoogleCallback`, extraer el parametro `code` de la URL.
3.  Enviar este `code` a tu Backend a traves de una peticion POST (ejemplo: a `http://localhost:3000/api/auth/google`).

## Fase 4: Intercambio del Codigo (Backend)

Una vez que el Backend recibe el `code` del Frontend, tendra que completar el proceso:

1.  El Backend realiza una peticion a `https://oauth2.googleapis.com/token` enviando:
    *   `client_id`
    *   `client_secret` (El cual debera estar en el `.env` del Backend de forma segura).
    *   `code`
    *   `grant_type=authorization_code`
    *   `redirect_uri` (La misma que usaste en el frontend).
2.  Google devolvera un `access_token` y un `id_token` (JWT).
3.  El Backend podra decodificar el `id_token` para obtener la informacion del usuario (email, nombre, foto) y registrar al usuario en la base de datos o iniciar su sesion.
4.  Finalmente, el Backend enviara un token de sesion de la aplicacion (ejemplo: un JWT propio) de vuelta al Frontend.
