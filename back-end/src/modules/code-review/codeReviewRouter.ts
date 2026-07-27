import { Router } from "express";
import { OpenAI } from "openai";
import Anthropic from "@anthropic-ai/sdk";
import prisma from "../../db.js";

const router = Router();

// POST run AI code review
router.post("/review", async (req, res) => {
  const { projectId, pullRequestNumber, codeFiles, provider } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
    });

    if (!project) return res.status(404).json({ error: "Project not found" });

    const codeToReview = (codeFiles || [])
      .map((f: any) => `File: ${f.filename}\n\`\`\`\n${f.content}\n\`\`\``)
      .join("\n\n");

    const prompt = `You are a strict, senior code reviewer. Review the following code for:
1. Logic and bug detection
2. Performance/optimization opportunities
3. Readability and clean code practices

Return your response as a valid JSON array of objects, each object containing:
- file: the filename
- line: line number or approximate range
- severity: "error" | "warning" | "info"
- message: clear review comments
- suggestion: proposed refactoring / replacement snippet

Do not return any markdown wraps outside of the JSON block, output ONLY the JSON array. Example:
[
  {
    "file": "main.js",
    "line": 42,
    "severity": "warning",
    "message": "Use const instead of var.",
    "suggestion": "const result = calculate();"
  }
]`;

    let reviewFindings = "";

    if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1500,
        messages: [
          { role: "user", content: `${prompt}\n\nCode to review:\n${codeToReview}` },
        ],
      });
      const textBlock = msg.content[0];
      if (textBlock && textBlock.type === "text") {
        reviewFindings = textBlock.text;
      }
    } else if (provider === "openai" && process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: `${prompt}\n\nCode to review:\n${codeToReview}` }],
        max_tokens: 1500,
      });
      reviewFindings = completion.choices[0]?.message?.content || "";
    } else {
      const mockResult = (codeFiles || []).map((file: any) => ({
        file: file.filename,
        line: 5,
        severity: "warning",
        message: "Consider using structured error handling or try/catch blocks to prevent crashes.",
        suggestion: "try {\n  // your operation\n} catch (error) {\n  console.error(error);\n}",
      }));

      if (mockResult.length === 0) {
        mockResult.push({
          file: "index.js",
          line: 1,
          severity: "info",
          message: "No source files were submitted. Add files to analyze potential improvements.",
          suggestion: "// Example: const api = new ApiService();",
        });
      }
      reviewFindings = JSON.stringify(mockResult);
    }

    let parsedFindings;
    try {
      const cleanJson = reviewFindings.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedFindings = JSON.parse(cleanJson);
    } catch {
      parsedFindings = [
        {
          file: "System",
          line: 0,
          severity: "info",
          message: "AI returned review comments in a non-JSON format.",
          rawText: reviewFindings,
        },
      ];
    }

    const reviewResult = await prisma.codeReviewResult.create({
      data: {
        projectId: project.id,
        pullRequestNumber: pullRequestNumber ? parseInt(pullRequestNumber) : null,
        findings: JSON.stringify(parsedFindings),
        status: "COMPLETED",
      },
    });

    res.json(reviewResult);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Day-2: POST /analyze (strict system prompt) ────────────────────
// Receives raw code, forces the AI to return ONLY valid JSON with the
// exact schema: {"reviews": [{"linea", "tipo", "sugerencia"}]}
router.post("/analyze", async (req, res) => {
  const { code } = req.body;

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Se requiere un campo 'code' de tipo string." });
  }

  // ── Strict System Prompt ──
  const systemPrompt = `Eres un revisor de código IMPLACABLE y extremadamente estricto.
Tu trabajo es encontrar TODOS los problemas en el código que recibirás.

REGLAS ABSOLUTAS:
1. Responde ÚNICAMENTE con un objeto JSON válido. NADA MÁS.
2. NO uses formato Markdown. NO uses backticks. NO agregues texto introductorio ni conclusión.
3. El JSON debe tener EXACTAMENTE esta estructura:
   {"reviews": [{"linea": <número>, "tipo": "<categoría>", "sugerencia": "<texto>"}]}
4. El campo "tipo" SOLO puede ser uno de estos valores exactos: "seguridad", "performance", "estilo".
5. El campo "linea" debe ser un número entero indicando la línea aproximada del issue.
6. El campo "sugerencia" debe ser un texto conciso en español explicando qué mejorar.
7. Si no encuentras issues, devuelve: {"reviews": []}
8. NUNCA devuelvas texto fuera del objeto JSON. Tu respuesta COMPLETA debe ser parseable por JSON.parse().`;

  const userMessage = `Analiza este código línea por línea y devuelve el JSON con tus hallazgos:\n\n${code.slice(0, 6000)}`;

  try {
    let rawResponse = "";

    if (process.env.ANTHROPIC_API_KEY) {
      // ── Anthropic (system prompt as top-level param) ──
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });
      const block = msg.content[0];
      if (block && block.type === "text") rawResponse = block.text;
    } else if (process.env.OPENAI_API_KEY) {
      // ── OpenAI (system prompt as system message) ──
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 2000,
        temperature: 0.1, // Low temp for consistent JSON output
      });
      rawResponse = completion.choices[0]?.message?.content || "";
    } else {
      // ── Mock fallback (sin API keys) ──
      rawResponse = JSON.stringify({
        reviews: [
          { linea: 1, tipo: "estilo", sugerencia: "Agrega 'use strict' o usa módulos ES para mayor consistencia del código." },
          { linea: 5, tipo: "estilo", sugerencia: "Usa 'const' en lugar de 'let' cuando la variable no se reasigna para prevenir mutaciones accidentales." },
          { linea: 8, tipo: "seguridad", sugerencia: "Evita usar 'any' como tipo. Define interfaces explícitas para mayor seguridad de tipos." },
          { linea: 12, tipo: "performance", sugerencia: "Evita crear objetos dentro de bucles; mueve la inicialización fuera del loop para reducir la presión del garbage collector." },
          { linea: 18, tipo: "seguridad", sugerencia: "Los errores capturados con catch deben validarse antes de acceder a sus propiedades para evitar excepciones inesperadas." },
        ],
      });
    }

    // Limpiar posibles backticks que la IA pueda agregar
    const clean = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);

    // Normalizar: asegurar que el formato sea siempre {reviews: [...]}
    if (parsed.reviews && Array.isArray(parsed.reviews)) {
      res.json(parsed);
    } else if (Array.isArray(parsed)) {
      res.json({ reviews: parsed });
    } else {
      res.json({ reviews: [] });
    }
  } catch (err: any) {
    console.error("[code-review/analyze]", err);
    res.status(500).json({ error: err.message || "Error al analizar el código." });
  }
});

// GET all reviews for a project
router.get("/reviews/:projectId", async (req, res) => {
  try {
    const reviews = await prisma.codeReviewResult.findMany({
      where: { projectId: parseInt(req.params.projectId) },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
