import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import routes (modularized by feature)
import dbDesignerRouter from "./modules/db-designer/dbDesignerRouter.js";
import taskAllocatorRouter from "./modules/task-allocator/taskAllocatorRouter.js";
import branchSyncRouter from "./modules/branch-sync/branchSyncRouter.js";
import docGeneratorRouter from "./modules/doc-generator/docGeneratorRouter.js";
import codeReviewRouter from "./modules/code-review/codeReviewRouter.js";
import authRouter from "./modules/auth/authRouter.js";
import uploadRouter from "./modules/upload/uploadRouter.js";
import deepLintRouter from "./modules/deeplint/deepLintRouter.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Base API route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Developer Productivity Tools API is running",
    region: process.env.AWS_REGION || "us-east-2",
    uptimeSeconds: process.uptime(),
  });
});

// Feature routers
app.use("/api/auth", authRouter);
app.use("/api/db-designer", dbDesignerRouter);
app.use("/api/task-allocator", taskAllocatorRouter);
app.use("/api/branch-sync", branchSyncRouter);
app.use("/api/doc-generator", docGeneratorRouter);
app.use("/api/code-review", codeReviewRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/deeplint", deepLintRouter);

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});
