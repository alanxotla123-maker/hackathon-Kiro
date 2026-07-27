import { Router } from "express";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import prisma from "../../db.js";
import path from "path";
import crypto from "crypto";

const router = Router();

// Configure Multer (store file in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  // In production, the credentials can be picked up automatically from environment
  // or EC2/ECS role. If needed, you can explicitly pass them like:
  // credentials: {
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  // }
});

router.post("/avatar", upload.single("avatar"), async (req, res) => {
  const file = req.file;
  const { email } = req.body;

  if (!file) {
    return res.status(400).json({ error: "No se proporcionó ninguna imagen" });
  }

  if (!email) {
    return res.status(400).json({ error: "No se proporcionó email" });
  }

  try {
    const ext = path.extname(file.originalname);
    const fileName = `${crypto.randomUUID()}${ext}`;
    // Using the user's requested S3 bucket path
    const key = `imagenes/aws-hack/${fileName}`;
    const bucketName = process.env.AWS_S3_BUCKET || "chihuahuenos";

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // You can set ACL to public-read if the bucket allows it, 
      // but otherwise, the bucket policy needs to allow public read access
      // ACL: "public-read", 
    });

    await s3Client.send(command);

    const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-2"}.amazonaws.com/${key}`;

    // Update user profile image in the database
    let updatedProfileImage = s3Url;
    try {
      const updatedUser = await prisma.user.update({
        where: { email: email },
        data: { profileImage: s3Url }
      });
      updatedProfileImage = updatedUser.profileImage || s3Url;
    } catch (dbErr) {
      console.warn("Usuario no encontrado en la DB, pero la imagen se subió a S3", dbErr);
    }

    res.json({
      message: "Imagen de perfil actualizada exitosamente",
      profileImage: updatedProfileImage
    });
  } catch (error: any) {
    console.error("Error al subir a S3:", error);
    res.status(500).json({ error: error.message || "Hubo un error al subir la imagen" });
  }
});

export default router;
