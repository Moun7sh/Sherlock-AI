import { Router, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";

export const usersRouter = Router();
usersRouter.use(authenticate);

usersRouter.get("/", requireRole("ADMIN", "SUPERINTENDENT"), async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({ select: {
    id: true, badgeNumber: true, name: true, email: true, role: true,
    rank: true, department: true, station: true, isActive: true, lastLoginAt: true, createdAt: true,
  }, orderBy: { name: "asc" } });
  res.json({ data: users });
});

usersRouter.post("/", requireRole("ADMIN"), async (req: AuthRequest, res: Response) => {
  const { password, ...rest } = req.body;
  const passwordHash = await bcrypt.hash(password || "changeme123", 12);
  const user = await prisma.user.create({ data: { ...rest, passwordHash } });
  const profile = { ...user };
  const { passwordHash: _passwordHash, ...safeProfile } = profile;
  res.status(201).json(safeProfile);
});
