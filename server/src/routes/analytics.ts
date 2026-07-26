import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);

analyticsRouter.get("/dashboard", async (_req: AuthRequest, res: Response) => {
  const [totalCases, openCases, totalPersons, totalVehicles, totalEvidence, highThreat] = await Promise.all([
    prisma.case.count(),
    prisma.case.count({ where: { status: { in: ["OPEN", "UNDER_INVESTIGATION"] } } }),
    prisma.person.count(),
    prisma.vehicle.count(),
    prisma.evidence.count(),
    prisma.person.count({ where: { threatLevel: { in: ["HIGH", "CRITICAL"] } } }),
  ]);
  const crimeByType = await prisma.case.groupBy({ by: ["crimeType"], _count: true });
  const crimeByDistrict = await prisma.case.groupBy({ by: ["district"], _count: true });
  const recentCases = await prisma.case.findMany({ take: 5, orderBy: { createdAt: "desc" },
    select: { id: true, firNumber: true, title: true, crimeType: true, status: true, district: true, createdAt: true } });
  const wantedPersons = await prisma.person.findMany({ where: { threatLevel: { in: ["HIGH", "CRITICAL"] } },
    orderBy: { priorCount: "desc" }, take: 5 });
  res.json({ totalCases, openCases, totalPersons, totalVehicles, totalEvidence, highThreat,
    crimeByType, crimeByDistrict, recentCases, wantedPersons });
});

analyticsRouter.get("/heatmap", async (_req: AuthRequest, res: Response) => {
  const data = await prisma.case.findMany({ where: { latitude: { not: null }, longitude: { not: null } },
    select: { id: true, latitude: true, longitude: true, crimeType: true, district: true, dateOfOffence: true } });
  res.json(data);
});
