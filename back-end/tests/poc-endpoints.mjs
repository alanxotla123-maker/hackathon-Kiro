/**
 * ═══════════════════════════════════════════════════════════════════
 *  Day 2 – Integration Tests for Scan + Strict Code Review
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

// ─── Test 1: GET /api/doc-generator/scan ────────────────────────────
async function testScan() {
  console.log("\n─── GET /api/doc-generator/scan ───");

  const res = await fetch(`${API}/doc-generator/scan`);
  const data = await res.json();

  assert(res.status === 200, "Status is 200");
  assert(typeof data.totalFiles === "number", "Has 'totalFiles' (number)");
  assert(Array.isArray(data.files), "Has 'files' array");
  assert(data.totalFiles > 0, `Found ${data.totalFiles} files`);
  assert(data.files.length === data.totalFiles, "totalFiles matches files.length");

  if (data.files.length > 0) {
    const f = data.files[0];
    assert(typeof f.filepath === "string", "File has 'filepath' (string)");
    assert(typeof f.content === "string", "File has 'content' (string)");
    assert(f.filepath.includes("/"), "filepath uses forward slashes");
    assert(!f.filepath.includes("node_modules"), "No node_modules in results");
  }

  // Check both back-end and front-end are scanned
  const hasBackend = data.files.some((f) => f.filepath.startsWith("back-end/"));
  const hasFrontend = data.files.some((f) => f.filepath.startsWith("front-end/"));
  assert(hasBackend, "Includes back-end/src files");
  assert(hasFrontend, "Includes front-end/src files");
}

// ─── Test 2: GET /api/doc-generator/generate (still works) ──────────
async function testGenerate() {
  console.log("\n─── GET /api/doc-generator/generate (Day 1 compat) ───");

  const res = await fetch(`${API}/doc-generator/generate`);
  const data = await res.json();

  assert(res.status === 200, "Status is 200");
  assert(typeof data.filename === "string", "Has 'filename'");
  assert(typeof data.content === "string", "Has 'content'");
}

// ─── Test 3: POST /api/code-review/analyze (strict schema) ─────────
async function testAnalyzeStrictSchema() {
  console.log("\n─── POST /api/code-review/analyze (strict schema) ───");

  const res = await fetch(`${API}/code-review/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "let x = 1;\nvar y: any = 2;\nfor(let i=0;i<10;i++){const obj = new Object();}" }),
  });
  const data = await res.json();

  assert(res.status === 200, "Status is 200");
  assert("reviews" in data, "Response has 'reviews' key (not 'issues')");
  assert(Array.isArray(data.reviews), "'reviews' is an array");
  assert(data.reviews.length > 0, `Got ${data.reviews.length} review(s)`);

  const r = data.reviews[0];
  assert(typeof r.linea === "number", "Review has 'linea' (number)");
  assert(typeof r.tipo === "string", "Review has 'tipo' (string)");
  assert(typeof r.sugerencia === "string", "Review has 'sugerencia' (string)");

  const validTypes = ["seguridad", "performance", "estilo"];
  assert(
    validTypes.includes(r.tipo),
    `tipo is valid enum: '${r.tipo}' ∈ [seguridad, performance, estilo]`
  );
}

// ─── Test 4: Validation still works ─────────────────────────────────
async function testAnalyzeValidation() {
  console.log("\n─── POST /api/code-review/analyze (validation) ───");

  const res1 = await fetch(`${API}/code-review/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert(res1.status === 400, "Empty body → 400");

  const res2 = await fetch(`${API}/code-review/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: 12345 }),
  });
  assert(res2.status === 400, "code as number → 400");
}

// ─── Test 5: End-to-end: Scan → Pick File → Analyze ─────────────────
async function testEndToEnd() {
  console.log("\n─── End-to-End: Scan → Pick File → Analyze ───");

  const scanRes = await fetch(`${API}/doc-generator/scan`);
  const scanData = await scanRes.json();
  assert(scanRes.status === 200, "Step 1: Scan returned 200");
  assert(scanData.files.length > 0, `Step 1: Got ${scanData.files.length} files`);

  // Pick the first .ts file
  const tsFile = scanData.files.find((f) => f.filepath.endsWith(".ts"));
  assert(!!tsFile, `Step 2: Found a .ts file (${tsFile?.filepath})`);

  if (tsFile) {
    const reviewRes = await fetch(`${API}/code-review/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: tsFile.content }),
    });
    const reviewData = await reviewRes.json();

    assert(reviewRes.status === 200, "Step 3: Analyze returned 200");
    assert(Array.isArray(reviewData.reviews), "Step 3: Got reviews array");
    assert(
      reviewData.reviews.length > 0,
      `Step 3: Got ${reviewData.reviews.length} review(s) for ${tsFile.filepath}`
    );
  }
}

// ─── Runner ──────────────────────────────────────────────────────────
async function run() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   Day 2 – Endpoint Integration Tests               ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  try {
    await testScan();
    await testGenerate();
    await testAnalyzeStrictSchema();
    await testAnalyzeValidation();
    await testEndToEnd();
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
