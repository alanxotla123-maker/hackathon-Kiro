import { Router } from "express";
import prisma from "../../db.js";
import axios from "axios";

const router = Router();

// POST GitHub OAuth callback / token exchange
router.post("/github", async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Falta el código de autorización" });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Las credenciales de GitHub no están configuradas en el backend (.env)" });
  }

  try {
    // 1. Intercambiar el código por el token de acceso
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const { access_token, error, error_description } = tokenResponse.data;
    if (error) {
      return res.status(400).json({ error: error_description || error });
    }

    // 2. Obtener los datos del usuario desde la API de GitHub
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const githubUser = userResponse.data;
    const name = githubUser.name || githubUser.login;
    const profileImage = githubUser.avatar_url;

    // 3. Obtener el email (por si es privado)
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await axios.get("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      const primaryEmail = emailsResponse.data.find((e: any) => e.primary);
      email = primaryEmail ? primaryEmail.email : null;
    }

    if (!email) {
      email = `${githubUser.login}@github.com`; // Fallback email
    }

    // 4. Buscar o crear el usuario en la base de datos local
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          role: "Developer",
          profileImage,
        },
      });
    } else {
      // Actualizar la foto de perfil y nombre si cambiaron
      user = await prisma.user.update({
        where: { email },
        data: {
          name,
          profileImage,
        },
      });
    }

    res.json({
      message: "Autenticación de GitHub exitosa",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (err: any) {
    console.error("Error en auth de GitHub:", err.response?.data || err.message);
    res.status(500).json({ error: "Error de servidor en autenticación de GitHub" });
  }
});


// POST Google OAuth callback / token exchange
router.post("/google", async (req, res) => {
  const { code, redirectUri } = req.body;
  if (!code || !redirectUri) {
    return res.status(400).json({ error: "Falta el código de autorización o redirectUri" });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Las credenciales de Google no están configuradas en el backend (.env)" });
  }

  try {
    // 1. Intercambiar el código por el token de acceso
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }
    );

    const { access_token } = tokenResponse.data;

    // 2. Obtener los datos del usuario desde Google UserInfo API
    const userResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const googleUser = userResponse.data;
    const name = googleUser.name || googleUser.given_name;
    const email = googleUser.email;
    const profileImage = googleUser.picture;

    if (!email) {
      return res.status(400).json({ error: "No se pudo obtener el correo de Google" });
    }

    // 3. Buscar o crear el usuario en la base de datos local
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          role: "Developer",
          profileImage,
        },
      });
    } else {
      // Actualizar la foto de perfil y nombre si cambiaron
      user = await prisma.user.update({
        where: { email },
        data: {
          name,
          profileImage,
        },
      });
    }

    res.json({
      message: "Autenticación de Google exitosa",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (err: any) {
    console.error("Error en auth de Google:", err.response?.data || err.message);
    res.status(500).json({ error: "Error de servidor en autenticación de Google" });
  }
});



// POST register
router.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Por favor, completa todos los campos" });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return res.status(400).json({ error: "Este correo ya está registrado" });
    }

    const newUser = await prisma.user.create({
      data: {
        name: fullName,
        email: email,
        password: password,
        role: "Developer"
      }
    });

    res.status(201).json({ 
      message: "Registro exitoso en la base de datos!", 
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña requeridos" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: username }
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    res.json({
      message: "Inicio de sesión correcto!",
      user: { id: user.id, name: user.name, email: user.email, role: user.role, profileImage: user.profileImage }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET user by name
router.get("/user/:name", async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { name: req.params.name }
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
