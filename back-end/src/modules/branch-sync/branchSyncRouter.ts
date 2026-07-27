import { Router } from "express";
import axios from "axios";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import prisma from "../../db.js";

const router = Router();
const execFileAsync = promisify(execFile);

// Project root is 4 levels up from this file: back-end/src/modules/branch-sync/ → project root
const REPO_ROOT = resolve(__dirname, "..", "..", "..", "..");

const runGit = (args: string[]): Promise<string> =>
  execFileAsync("git", args, { cwd: REPO_ROOT }).then((r) => r.stdout.trim());

// GET real ahead/behind status of every remote team branch vs origin/main (read-only, uses
// whatever refs were last fetched locally — does not run `git fetch`).
router.get("/team-status", async (_req, res) => {
  try {
    const branchesRaw = await runGit(["branch", "-r", "--format=%(refname:short)"]);
    const branches = branchesRaw
      .split("\n")
      .map((b) => b.trim())
      .filter((b) => b && b !== "origin" && b !== "origin/main" && b !== "origin/HEAD");

    const results = await Promise.all(
      branches.map(async (branch) => {
        const counts = await runGit(["rev-list", "--left-right", "--count", `origin/main...${branch}`]);
        const [behindMain, aheadOfMain] = counts.split(/\s+/).map((n) => parseInt(n, 10));
        return { branch: branch.replace(/^origin\//, ""), aheadOfMain, behindMain };
      })
    );

    results.sort((a, b) => b.aheadOfMain - a.aheadOfMain);
    res.json({ baseBranch: "main", branches: results });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to read git status" });
  }
});

// GET synchronization status of a project
router.get("/status/:projectId", async (req, res) => {
  const projectId = parseInt(req.params.projectId);
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) return res.status(404).json({ error: "Project not found" });

    let alert = await prisma.syncAlert.findFirst({
      where: { projectId },
    });

    if (!alert) {
      alert = await prisma.syncAlert.create({
        data: {
          projectId,
          branchName: "main",
          behindByCommits: 0,
          status: "UP_TO_DATE",
        },
      });
    }

    const githubToken = process.env.GITHUB_ACCESS_TOKEN;

    if (!githubToken || githubToken === "your_github_access_token_here") {
      return res.json({
        alert,
        notice: "Using mock synchronization status. Configure GITHUB_ACCESS_TOKEN for real-time monitoring.",
      });
    }

    try {
      const url = `https://api.github.com/repos/${project.owner}/${project.repoName}/commits/main`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      const latestSha = response.data.sha;

      if (alert.latestCommitSha && alert.latestCommitSha !== latestSha) {
        const updatedAlert = await prisma.syncAlert.update({
          where: { id: alert.id },
          data: {
            behindByCommits: 1,
            latestCommitSha: latestSha,
            status: "BEHIND",
          },
        });
        return res.json({ alert: updatedAlert });
      } else {
        const updatedAlert = await prisma.syncAlert.update({
          where: { id: alert.id },
          data: {
            latestCommitSha: latestSha,
          },
        });
        return res.json({ alert: updatedAlert });
      }
    } catch (apiError: any) {
      return res.json({
        alert,
        warning: `GitHub API call failed: ${apiError.message}. Returning cached status.`,
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GitHub Webhook receiver
router.post("/webhook", async (req, res) => {
  const { repository, ref } = req.body;
  try {
    if (!repository || !ref) {
      return res.status(400).json({ error: "Invalid webhook payload format" });
    }

    const owner = repository.owner.name || repository.owner.login;
    const repoName = repository.name;

    const project = await prisma.project.findFirst({
      where: { owner, repoName },
    });

    if (!project) {
      return res.status(404).json({ error: "No matching project registered in DB" });
    }

    if (ref === "refs/heads/main") {
      const alert = await prisma.syncAlert.findFirst({
        where: { projectId: project.id },
      });

      if (alert) {
        const updatedAlert = await prisma.syncAlert.update({
          where: { id: alert.id },
          data: {
            behindByCommits: alert.behindByCommits + 1,
            status: "BEHIND",
          },
        });
        return res.json({ message: "Webhook processed. Branch is BEHIND.", alert: updatedAlert });
      }
    }

    res.json({ message: "Webhook received but no action required." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
