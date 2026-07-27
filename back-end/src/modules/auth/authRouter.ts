import { Router } from "express";
import prisma from "../../db.js";

const router = Router();

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
