/// <reference types="node" />
// @ts-nocheck
import { writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { OpenAI } from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Helper to safely load env vars if this is run directly
import "dotenv/config";

const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const IGNORED_DIRS = new Set(["node_modules", "dist", ".git", ".next", "build", "coverage"]);

function walkDir(dir: string): string[] {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry)) continue;

    const fullPath = join(dir, entry);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (stat.isFile() && ALLOWED_EXTENSIONS.has(extname(entry))) {
      results.push(fullPath);
    }
  }
  return results;
}

async function generateReadme() {
  console.log("🚀 Iniciando generación de README (Dog Fooding)...");

  // 1. Escanear el proyecto
  const projectRoot = resolve(__dirname, "..", "..");
  const backendSrc = join(projectRoot, "back-end", "src");
  const frontendSrc = join(projectRoot, "front-end", "src");

  const backendFiles = walkDir(backendSrc);
  const frontendFiles = walkDir(frontendSrc);

  const totalFiles = backendFiles.length + frontendFiles.length;
  console.log(`📁 Encontrados ${totalFiles} archivos fuente.`);

  // 2. Preparar el prompt
  const systemPrompt = `Eres un Developer Advocate experto redactando READMEs increíbles para repositorios de GitHub.
Tu objetivo es generar el README.md final para un proyecto de Hackathon llamado "Kiro".

ESTRUCTURA OBLIGATORIA:
# Kiro
[Un logo en texto o un subtítulo inspirador]

## 🎯 El Problema que Resolvemos
[Explica brevemente qué dolor soluciona Kiro basándote en que tiene un AI-Powered Code Review y Rapid Documentation Generator]

## 🏗️ Arquitectura y Tecnologías
- **Frontend**: React, Vite, TypeScript, Monaco Editor
- **Backend**: Node.js, Express, TypeScript, Prisma
- **IA**: Soporte para Anthropic y OpenAI
- **Arquitectura Modular**: Endpoints separados para escaneo, análisis y generación de docs.

## 🚀 Cómo Correr el Proyecto (Docker)
[Provee comandos claros para hacer \`docker-compose up -d\` o similar, indicando que levanta frontend, backend y DB]

## ✨ Módulos Destacados
[Menciona el Code Review Dashboard de 3 paneles y el escáner recursivo]

REGLAS:
- Devuelve ÚNICAMENTE el código Markdown válido. Nada de texto introductorio.
- Usa emojis y estilo profesional de alto impacto.`;

  const userMessage = `El proyecto tiene la siguiente escala:\n- Backend: ${backendFiles.length} archivos fuente.\n- Frontend: ${frontendFiles.length} archivos fuente.\n\nPor favor, genera el README final del proyecto.`;

  console.log("🤖 Solicitando redacción a la IA...");
  
  let markdown = "";

  try {
    if (process.env.ANTHROPIC_API_KEY) {
      console.log("Usando Anthropic...");
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });
      const block = msg.content[0];
      if (block && block.type === "text") markdown = block.text;
    } else if (process.env.OPENAI_API_KEY) {
      console.log("Usando OpenAI...");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 3000,
      });
      markdown = completion.choices[0]?.message?.content || "";
    } else {
      console.warn("⚠️ No se encontraron API keys. Generando README local mock...");
      markdown = `# Kiro 🚀\n\n## 🎯 El Problema que Resolvemos\nAutomatizamos revisiones de código exhaustivas y generación de documentación instantánea para equipos ágiles.\n\n## 🏗️ Arquitectura\n- **Frontend**: React, Vite, TS\n- **Backend**: Node.js, Express, TS\n\n## 🚀 Cómo Correr el Proyecto\n\`\`\`bash\ndocker-compose up --build\n\`\`\`\n\n> *Nota: Configura \`ANTHROPIC_API_KEY\` para generar la versión IA real.*`;
    }

    const cleanMarkdown = markdown.replace(/^```markdown\n/, "").replace(/\n```$/, "").trim();
    
    // 3. Escribir archivo en la raíz
    const outputPath = join(projectRoot, "README-KIRO.md");
    writeFileSync(outputPath, cleanMarkdown, "utf-8");
    
    console.log(`✅ ¡Éxito! README generado en: ${outputPath}`);
  } catch (error: any) {
    console.error("❌ Error generando el README:", error.message);
  }
}

generateReadme();
