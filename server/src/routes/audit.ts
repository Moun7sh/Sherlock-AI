import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";

export const auditRouter = Router();
auditRouter.use(authenticate);
auditRouter.use(requireRole("ADMIN", "SUPERINTENDENT"));

auditRouter.get("/", async (req: AuthRequest, res: Response) => {
  const { entity, page = "1", limit = "50" } = req.query;
  const where = entity ? { entity: entity as string } : {};
  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({ where, skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string), orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, badgeNumber: true } } } }),
    prisma.auditLog.count({ where }),
  ]);
  res.json({ data, total });
});
