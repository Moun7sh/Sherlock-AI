import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { runAgentPipeline } from "../agents/pipeline";

export const agentsRouter = Router();
agentsRouter.use(authenticate);

agentsRouter.post("/analyze", async (req: AuthRequest, res: Response) => {
  const { caseId, query } = req.body;
  const result = await runAgentPipeline(caseId, query);
  res.json(result);
});

agentsRouter.get("/status", async (_req: AuthRequest, res: Response) => {
  res.json({
    agents: [
      { id: "investigation", name: "Investigation AI", status: "active" },
      { id: "financial", name: "Financial Crime AI", status: "active" },
      { id: "forensic", name: "Forensic AI", status: "active" },
      { id: "cyber", name: "Cyber & CDR AI", status: "active" },
      { id: "behavioral", name: "Behaviour Analysis AI", status: "active" },
      { id: "legal", name: "Legal AI", status: "active" },
    ],
  });
});
