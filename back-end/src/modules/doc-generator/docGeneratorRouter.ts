import { Router } from "express";
import { OpenAI } from "openai";
import Anthropic from "@anthropic-ai/sdk";
import prisma from "../../db.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const router = Router();

// ─── POC Day-1: GET /generate ───────────────────────────────────────
// Lee un archivo .ts local y devuelve su contenido crudo.
// Funciona sin Prisma ni API keys – perfecto para probar el frontend.
router.get("/generate", (_req, res) => {
  try {
    // __dirname is available because the backend runs in CJS mode (tsx)
    const targetFile = resolve(__dirname, "docGeneratorRouter.ts");

    const content = readFileSync(targetFile, "utf-8");
    res.json({ filename: "docGeneratorRouter.ts", content });
  } catch (err: any) {
    console.error("[doc-generator/generate]", err);
    res.status(500).json({ error: err.message || "Error leyendo archivo." });
  }
});

// POST trigger document generation
router.post("/generate", async (req, res) => {
  const { projectId, sourceCodeSummary, provider } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
    });

    if (!project) return res.status(404).json({ error: "Project not found" });

    const docJob = await prisma.documentationJob.create({
      data: {
        projectId: project.id,
        status: "PROCESSING",
      },
    });

    const codeContext = sourceCodeSummary || `Project Name: ${project.name}\nGitHub URL: ${project.githubRepoUrl}`;

    const prompt = `You are a technical documentation assistant. Generate a clean, well-structured, professional Markdown README.md file for the following codebase context:\n\n${codeContext}\n\nInclude a title, description, features, setup guide, and usage examples.`;

    let generatedReadme = "";

    if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });
      const textBlock = msg.content[0];
      if (textBlock && textBlock.type === "text") {
        generatedReadme = textBlock.text;
      }
    } else if (provider === "openai" && process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
      });
      generatedReadme = completion.choices[0]?.message?.content || "";
    } else {
      generatedReadme = `# ${project.name}\n\nGenerated automatically by Rapid Documentation Generator.\n\n## Description\nThis is the project repository for **${project.name}**. Explore our modules and tools.\n\n## Repository Link\n[GitHub Repository](${project.githubRepoUrl})\n\n> *Notice: Configure OpenAI or Anthropic API Keys in the environment to generate complete AI-powered docs.*`;
    }

    const updatedJob = await prisma.documentationJob.update({
      where: { id: docJob.id },
      data: {
        generatedReadme,
        status: "COMPLETED",
      },
    });

    res.json(updatedJob);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET all documentation jobs for a project
router.get("/jobs/:projectId", async (req, res) => {
  try {
    const jobs = await prisma.documentationJob.findMany({
      where: { projectId: parseInt(req.params.projectId) },
      orderBy: { createdAt: "desc" },
    });
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
