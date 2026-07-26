import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { z } from "zod";
import { getParamString, getQueryString } from "../utils/query";

export const casesRouter = Router();
casesRouter.use(authenticate);

const createSchema = z.object({
  firNumber: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  crimeType: z.string().min(1),
  ipcSections: z.array(z.string()).default([]),
  station: z.string().min(1),
  district: z.string().min(1),
  place: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  dateOfOffence: z.string().transform(s => new Date(s)),
  timeOfOffence: z.string().optional(),
  dateOfFiling: z.string().transform(s => new Date(s)),
  estimatedLoss: z.string().optional(),
  summary: z.string().optional(),
});

casesRouter.get("/", async (req: AuthRequest, res: Response) => {
  const status = getQueryString(req.query.status);
  const crimeType = getQueryString(req.query.crimeType);
  const district = getQueryString(req.query.district);
  const page = getQueryString(req.query.page) ?? "1";
  const limit = getQueryString(req.query.limit) ?? "20";
  const search = getQueryString(req.query.search);
  const where: any = {};
  if (status) where.status = status;
  if (crimeType) where.crimeType = crimeType;
  if (district) where.district = district;
  if (search) where.OR = [
    { title: { contains: search, mode: "insensitive" } },
    { firNumber: { contains: search, mode: "insensitive" } },
    { description: { contains: search, mode: "insensitive" } },
  ];
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [cases, total] = await Promise.all([
    prisma.case.findMany({
      where, skip, take: parseInt(limit, 10),
      orderBy: { createdAt: "desc" },
      include: { suspects: { include: { person: true } }, vehicles: { include: { vehicle: true } },
        assignments: { include: { user: { select: { id: true, name: true, rank: true } } } },
        _count: { select: { evidence: true, notes: true, timelineEvents: true } } },
    }),
    prisma.case.count({ where }),
  ]);
  res.json({ data: cases, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
});

casesRouter.get("/stats", async (_req: AuthRequest, res: Response) => {
  const [total, open, underInv, closed] = await Promise.all([
    prisma.case.count(),
    prisma.case.count({ where: { status: "OPEN" } }),
    prisma.case.count({ where: { status: "UNDER_INVESTIGATION" } }),
    prisma.case.count({ where: { status: "CLOSED" } }),
  ]);
  const byType = await prisma.case.groupBy({ by: ["crimeType"], _count: true, orderBy: { _count: { crimeType: "desc" } } });
  const byDistrict = await prisma.case.groupBy({ by: ["district"], _count: true, orderBy: { _count: { district: "desc" } } });
  const byMonth = await prisma.$queryRaw`
    SELECT TO_CHAR(date_of_offence, 'YYYY-MM') as month, COUNT(*)::int as count
    FROM cases GROUP BY month ORDER BY month DESC LIMIT 12`;
  res.json({ total, open, underInvestigation: underInv, closed, byType, byDistrict, byMonth });
});

casesRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const caseId = getParamString(req.params.id);
  if (!caseId) throw new AppError(400, "Invalid case id");
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      suspects: { include: { person: true } },
      vehicles: { include: { vehicle: true } },
      phones: { include: { phone: true } },
      bankAccounts: { include: { bankAccount: true } },
      evidence: true,
      timelineEvents: { orderBy: { timestamp: "asc" } },
      assignments: { include: { user: { select: { id: true, name: true, rank: true, badgeNumber: true } } } },
      notes: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!c) throw new AppError(404, "Case not found");
  res.json(c);
});

casesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const data = createSchema.parse(req.body);
  const existing = await prisma.case.findUnique({ where: { firNumber: data.firNumber } });
  if (existing) throw new AppError(409, "FIR number already exists");
  const c = await prisma.case.create({ data: { ...data, dateOfFiling: data.dateOfFiling || new Date() } });
  await prisma.auditLog.create({ data: { userId: req.userId, action: "CREATE", entity: "case", entityId: c.id } });
  res.status(201).json(c);
});

casesRouter.patch("/:id", async (req: AuthRequest, res: Response) => {
  const caseId = getParamString(req.params.id);
  if (!caseId) throw new AppError(400, "Invalid case id");
  const c = await prisma.case.update({ where: { id: caseId }, data: req.body });
  await prisma.auditLog.create({ data: { userId: req.userId, action: "UPDATE", entity: "case", entityId: c.id, details: req.body } });
  res.json(c);
});

casesRouter.get("/:id/timeline", async (req: AuthRequest, res: Response) => {
  const caseId = getParamString(req.params.id);
  if (!caseId) throw new AppError(400, "Invalid case id");
  const events = await prisma.timelineEvent.findMany({
    where: { caseId }, orderBy: { timestamp: "asc" },
  });
  res.json(events);
});

casesRouter.post("/:id/notes", async (req: AuthRequest, res: Response) => {
  const caseId = getParamString(req.params.id);
  if (!caseId) throw new AppError(400, "Invalid case id");
  const note = await prisma.note.create({
    data: { caseId, userId: req.userId!, content: req.body.content, isPrivate: req.body.isPrivate ?? false },
  });
  res.status(201).json(note);
});
