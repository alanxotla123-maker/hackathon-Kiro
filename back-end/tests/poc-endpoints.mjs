/**
 * ═══════════════════════════════════════════════════════════════════
 *  POC Day 1 – Integration Tests for Code Review & Doc Generator
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Run:  node back-end/tests/poc-endpoints.mjs
 *  Requires: backend running on http://localhost:3000
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

async function testDocGeneratorGenerate() {
  console.log("\n─── GET /api/doc-generator/generate ───");

  const res = await fetch(`${API}/doc-generator/generate`);
  const data = await res.json();

  assert(res.status === 200, "Status is 200");
  assert(typeof data.filename === "string", "Response has 'filename' (string)");
  assert(typeof data.content === "string", "Response has 'content' (string)");
  assert(data.content.length > 0, "Content is not empty");
  assert(
    data.content.includes("import"),
    "Content looks like TypeScript source (contains 'import')"
  );
  assert(
    data.filename === "docGeneratorRouter.ts",
    `Filename is 'docGeneratorRouter.ts' (got '${data.filename}')`
  );
}

async function testCodeReviewAnalyze_ValidCode() {
  console.log("\n─── POST /api/code-review/analyze (valid code) ───");

  const sampleCode = `
let x = 1;
var y = 2;
function doStuff() {
  for (let i = 0; i < 100; i++) {
    const obj = new Object();
    console.log(obj);
  }
}
`;

  const res = await fetch(`${API}/code-review/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: sampleCode }),
  });
  const data = await res.json();

  assert(res.status === 200, "Status is 200");
  assert(Array.isArray(data.issues), "Response has 'issues' array");
  assert(data.issues.length > 0, "At least one issue returned");

  const firstIssue = data.issues[0];
  assert(typeof firstIssue.linea === "number", "Issue has 'linea' (number)");
  assert(
    typeof firstIssue.tipo_de_issue === "string",
    "Issue has 'tipo_de_issue' (string)"
  );
  assert(
    typeof firstIssue.sugerencia === "string",
    "Issue has 'sugerencia' (string)"
  );

  const validTypes = ["bug", "performance", "style", "security", "best-practice"];
  assert(
    validTypes.includes(firstIssue.tipo_de_issue),
    `tipo_de_issue is valid enum (got '${firstIssue.tipo_de_issue}')`
  );
}

async function testCodeReviewAnalyze_EmptyBody() {
  console.log("\n─── POST /api/code-review/analyze (empty body → 400) ───");

  const res = await fetch(`${API}/code-review/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const data = await res.json();

  assert(res.status === 400, "Status is 400");
  assert(typeof data.error === "string", "Response has error message");
}

async function testCodeReviewAnalyze_InvalidType() {
  console.log("\n─── POST /api/code-review/analyze (code as number → 400) ───");

  const res = await fetch(`${API}/code-review/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: 12345 }),
  });
  const data = await res.json();

  assert(res.status === 400, "Status is 400");
  assert(typeof data.error === "string", "Response has error message");
}

async function testEndToEndFlow() {
  console.log("\n─── End-to-End: DocGen → CodeReview ───");

  // Step 1: Get file from doc generator
  const docRes = await fetch(`${API}/doc-generator/generate`);
  const docData = await docRes.json();
  assert(docRes.status === 200, "Step 1: Doc generator returned 200");

  // Step 2: Send that content to code review
  const reviewRes = await fetch(`${API}/code-review/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: docData.content }),
  });
  const reviewData = await reviewRes.json();

  assert(reviewRes.status === 200, "Step 2: Code review returned 200");
  assert(Array.isArray(reviewData.issues), "Step 2: Got issues array");
  assert(
    reviewData.issues.length > 0,
    `Step 2: Got ${reviewData.issues.length} issue(s) from reviewing docGeneratorRouter.ts`
  );
}

// ─── Runner ──────────────────────────────────────────────────────────
async function run() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   POC Day 1 – Endpoint Integration Tests           ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  try {
    await testDocGeneratorGenerate();
    await testCodeReviewAnalyze_ValidCode();
    await testCodeReviewAnalyze_EmptyBody();
    await testCodeReviewAnalyze_InvalidType();
    await testEndToEndFlow();
  } catch (err) {
    console.error("\n💥 Unexpected error:", err.message);
    failed++;
  }

  console.log("\n══════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("══════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run();
