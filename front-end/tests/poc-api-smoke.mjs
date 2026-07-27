/**
 * ═══════════════════════════════════════════════════════════════════
 *  POC Day 1 – Frontend API Smoke Tests
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Run:  node front-end/tests/poc-api-smoke.mjs
 *  Requires: backend running on http://localhost:3000
 *
 *  These tests validate that the frontend's expected API contract
 *  matches what the backend actually returns.
 */

const API = "http://localhost:3000/api";

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function testFrontendDocGeneratorContract() {
  console.log("\n─── Frontend Contract: GET /api/doc-generator/generate ───");

  const res = await fetch(`${API}/doc-generator/generate`);
  const data = await res.json();

  // AIPoc.tsx expects: data.content (string) and data.filename (string)
  assert(res.status === 200, "Endpoint is reachable");
  assert("content" in data, "Response has 'content' field (AIPoc.tsx line 43)");
  assert("filename" in data, "Response has 'filename' field (AIPoc.tsx line 44)");
  assert(typeof data.content === "string", "'content' is a string");
  assert(typeof data.filename === "string", "'filename' is a string");
}

async function testFrontendCodeReviewContract() {
  console.log("\n─── Frontend Contract: POST /api/code-review/analyze ───");

  const res = await fetch(`${API}/code-review/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "const x = 1;" }),
  });
  const data = await res.json();

  // AIPoc.tsx expects: data.issues (array of {linea, tipo_de_issue, sugerencia})
  assert(res.status === 200, "Endpoint is reachable");
  assert("issues" in data, "Response has 'issues' field (AIPoc.tsx line 68)");
  assert(Array.isArray(data.issues), "'issues' is an array");

  if (data.issues.length > 0) {
    const issue = data.issues[0];
    assert("linea" in issue, "Issue has 'linea' field");
    assert("tipo_de_issue" in issue, "Issue has 'tipo_de_issue' field");
    assert("sugerencia" in issue, "Issue has 'sugerencia' field");
  }
}

async function testMarkdownRenderability() {
  console.log("\n─── Markdown Table Generation (simulates AIPoc logic) ───");

  // Simulate what AIPoc.tsx does with the response
  const res = await fetch(`${API}/code-review/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "var x = 1;\nlet y = 2;\nfunction foo() {}" }),
  });
  const data = await res.json();

  // Replicate the markdown-building logic from AIPoc.tsx lines 78-88
  const md = [
    "## 🔍 Resultados del Code Review",
    "",
    `Se encontraron **${data.issues.length}** observaciones.`,
    "",
    "| Línea | Tipo | Sugerencia |",
    "|------:|------|------------|",
    ...data.issues.map(
      (i) => `| ${i.linea} | \`${i.tipo_de_issue}\` | ${i.sugerencia} |`
    ),
  ].join("\n");

  assert(md.includes("| Línea | Tipo | Sugerencia |"), "Markdown table header present");
  assert(md.includes("|------:|------|------------|"), "Markdown table separator present");
  assert(md.split("\n").length >= 7, `Markdown has enough rows (${md.split("\\n").length} lines)`);

  console.log("\n  📝 Generated Markdown preview:");
  console.log("  " + md.split("\n").slice(0, 10).join("\n  "));
}

// ─── Runner ──────────────────────────────────────────────────────────
async function run() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   POC Day 1 – Frontend API Smoke Tests             ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  try {
    await testFrontendDocGeneratorContract();
    await testFrontendCodeReviewContract();
    await testMarkdownRenderability();
  } catch (err) {
    console.error("\n💥 Unexpected error:", err.message);
    console.error("   Make sure the backend is running: cd back-end && npm run dev");
    failed++;
  }

  console.log("\n══════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("══════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run();
