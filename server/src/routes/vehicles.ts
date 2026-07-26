import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { z } from "zod";
import { getParamString, getQueryString } from "../utils/query";

export const vehiclesRouter = Router();
vehiclesRouter.use(authenticate);

vehiclesRouter.get("/", async (req: AuthRequest, res: Response) => {
  const search = getQueryString(req.query.search);
  const color = getQueryString(req.query.color);
  const type = getQueryString(req.query.type);
  const page = getQueryString(req.query.page) ?? "1";
  const limit = getQueryString(req.query.limit) ?? "20";
  const where: any = {};
  if (search) where.OR = [
    { registration: { contains: search, mode: "insensitive" } },
    { make: { contains: search, mode: "insensitive" } },
    { ownerName: { contains: search, mode: "insensitive" } },
  ];
  if (color) where.color = { equals: color, mode: "insensitive" };
  if (type) where.type = { equals: type, mode: "insensitive" };
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [data, total] = await Promise.all([
    prisma.vehicle.findMany({ where, skip, take: parseInt(limit, 10),
      orderBy: { createdAt: "desc" },
      include: { caseLinks: { include: { case: { select: { id: true, firNumber: true, title: true } } } } } }),
    prisma.vehicle.count({ where }),
  ]);
  res.json({ data, total });
});

vehiclesRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const vehicleId = getParamString(req.params.id);
  if (!vehicleId) throw new AppError(400, "Invalid vehicle id");
  const v = await prisma.vehicle.findUnique({ where: { id: vehicleId },
    include: { caseLinks: { include: { case: true } } } });
  if (!v) throw new AppError(404, "Vehicle not found");
  res.json(v);
});

vehiclesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    registration: z.string().min(1), make: z.string().optional(), model: z.string().optional(),
    color: z.string().optional(), type: z.string().optional(),
    ownerName: z.string().optional(), ownerAddress: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const existing = await prisma.vehicle.findUnique({ where: { registration: data.registration } });
  if (existing) throw new AppError(409, "Vehicle with this registration already exists");
  const v = await prisma.vehicle.create({ data });
  await prisma.auditLog.create({ data: { userId: req.userId, action: "CREATE", entity: "vehicle", entityId: v.id } });
  res.status(201).json(v);
});

vehiclesRouter.patch("/:id", async (req: AuthRequest, res: Response) => {
  const vehicleId = getParamString(req.params.id);
  if (!vehicleId) throw new AppError(400, "Invalid vehicle id");
  const v = await prisma.vehicle.update({ where: { id: vehicleId }, data: req.body });
  await prisma.auditLog.create({ data: { userId: req.userId, action: "UPDATE", entity: "vehicle", entityId: v.id } });
  res.json(v);
});

vehiclesRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const vehicleId = getParamString(req.params.id);
  if (!vehicleId) throw new AppError(400, "Invalid vehicle id");
  await prisma.vehicle.delete({ where: { id: vehicleId } });
  await prisma.auditLog.create({ data: { userId: req.userId, action: "DELETE", entity: "vehicle", entityId: vehicleId } });
  res.json({ success: true });
});
