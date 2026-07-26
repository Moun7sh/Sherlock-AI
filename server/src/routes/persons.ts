import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { z } from "zod";
import { getParamString, getQueryString } from "../utils/query";

export const personsRouter = Router();
personsRouter.use(authenticate);

personsRouter.get("/", async (req: AuthRequest, res: Response) => {
  const search = getQueryString(req.query.search);
  const threat = getQueryString(req.query.threat);
  const page = getQueryString(req.query.page) ?? "1";
  const limit = getQueryString(req.query.limit) ?? "20";
  const where: any = {};
  if (threat) where.threatLevel = threat;
  if (search) where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { alias: { contains: search, mode: "insensitive" } },
    { address: { contains: search, mode: "insensitive" } },
  ];
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [data, total] = await Promise.all([
    prisma.person.findMany({ where, skip, take: parseInt(limit, 10),
      orderBy: { priorCount: "desc" },
      include: { caseLinks: { include: { case: { select: { id: true, firNumber: true, title: true } } } } } }),
    prisma.person.count({ where }),
  ]);
  res.json({ data, total });
});

personsRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const personId = getParamString(req.params.id);
  if (!personId) throw new AppError(400, "Invalid person id");
  const p = await prisma.person.findUnique({ where: { id: personId },
    include: { caseLinks: { include: { case: true } }, phoneLinks: { include: { phone: true } } } });
  if (!p) throw new AppError(404, "Person not found");
  res.json(p);
});

personsRouter.post("/", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name: z.string().min(1), alias: z.string().optional(), age: z.number().optional(),
    gender: z.string().optional(), address: z.string().optional(), phone: z.string().optional(),
    threatLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    description: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const p = await prisma.person.create({ data });
  await prisma.auditLog.create({ data: { userId: req.userId, action: "CREATE", entity: "person", entityId: p.id } });
  res.status(201).json(p);
});

personsRouter.patch("/:id", async (req: AuthRequest, res: Response) => {
  const personId = getParamString(req.params.id);
  if (!personId) throw new AppError(400, "Invalid person id");
  const p = await prisma.person.update({ where: { id: personId }, data: req.body });
  await prisma.auditLog.create({ data: { userId: req.userId, action: "UPDATE", entity: "person", entityId: p.id } });
  res.json(p);
});

personsRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const personId = getParamString(req.params.id);
  if (!personId) throw new AppError(400, "Invalid person id");
  await prisma.person.delete({ where: { id: personId } });
  await prisma.auditLog.create({ data: { userId: req.userId, action: "DELETE", entity: "person", entityId: personId } });
  res.json({ success: true });
});
