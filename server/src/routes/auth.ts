import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { signTokens, authenticate, AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { z } from "zod";

export const authRouter = Router();

const loginSchema = z.object({
  badgeNumber: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, "Invalid login payload");
  const { badgeNumber, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { badgeNumber } });
  if (!user || !user.isActive) throw new AppError(401, "Invalid credentials");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid credentials");

  const tokens = signTokens(user.id, user.role);
  await prisma.refreshToken.create({
    data: { token: tokens.refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 86400000) },
  });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await prisma.auditLog.create({ data: { userId: user.id, action: "LOGIN", entity: "user", entityId: user.id } });

  const profile = { ...user };
  const { passwordHash: _passwordHash, ...safeProfile } = profile;
  res.json({ ...tokens, user: safeProfile });
});

authRouter.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: {
    id: true, badgeNumber: true, name: true, email: true, role: true,
    rank: true, department: true, station: true, phone: true, avatarUrl: true, isActive: true,
  }});
  if (!user) throw new AppError(404, "User not found");
  res.json(user);
});

authRouter.post("/logout", authenticate, async (req: AuthRequest, res: Response) => {
  await prisma.refreshToken.deleteMany({ where: { userId: req.userId } });
  res.json({ success: true });
});
