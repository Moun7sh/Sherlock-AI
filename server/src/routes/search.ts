import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const searchRouter = Router();
searchRouter.use(authenticate);

searchRouter.get("/", async (req: AuthRequest, res: Response) => {
  const { q, type, page = "1", limit = "10" } = req.query;
  if (!q) return res.json({ cases: [], persons: [], vehicles: [], phones: [], evidence: [], notes: [], total: 0 });
  const query = q as string;
  const take = parseInt(limit as string);
  const skip = (parseInt(page as string) - 1) * take;
  const filterType = type as string | undefined;

  const results: any = {};
  let total = 0;

  if (!filterType || filterType === "cases") {
    const [data, count] = await Promise.all([
      prisma.case.findMany({ where: { OR: [
        { title: { contains: query, mode: "insensitive" } },
        { firNumber: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { crimeType: { contains: query, mode: "insensitive" } },
        { district: { contains: query, mode: "insensitive" } },
        { place: { contains: query, mode: "insensitive" } },
      ]}, take, skip, select: { id: true, firNumber: true, title: true, crimeType: true, status: true, district: true } }),
      prisma.case.count({ where: { OR: [
        { title: { contains: query, mode: "insensitive" } },
        { firNumber: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ]} }),
    ]);
    results.cases = data; total += count;
  }

  if (!filterType || filterType === "persons") {
    const [data, count] = await Promise.all([
      prisma.person.findMany({ where: { OR: [
        { name: { contains: query, mode: "insensitive" } },
        { alias: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
      ]}, take, skip, select: { id: true, name: true, alias: true, threatLevel: true, priorCount: true } }),
      prisma.person.count({ where: { OR: [
        { name: { contains: query, mode: "insensitive" } },
        { alias: { contains: query, mode: "insensitive" } },
      ]} }),
    ]);
    results.persons = data; total += count;
  }

  if (!filterType || filterType === "vehicles") {
    const [data, count] = await Promise.all([
      prisma.vehicle.findMany({ where: { OR: [
        { registration: { contains: query, mode: "insensitive" } },
        { make: { contains: query, mode: "insensitive" } },
        { color: { contains: query, mode: "insensitive" } },
        { ownerName: { contains: query, mode: "insensitive" } },
      ]}, take, skip, select: { id: true, registration: true, make: true, model: true, color: true } }),
      prisma.vehicle.count({ where: { registration: { contains: query, mode: "insensitive" } } }),
    ]);
    results.vehicles = data; total += count;
  }

  if (!filterType || filterType === "phones") {
    const data = await prisma.phoneNumber.findMany({ where: { OR: [
      { number: { contains: query, mode: "insensitive" } },
      { carrier: { contains: query, mode: "insensitive" } },
    ]}, take, skip, select: { id: true, number: true, carrier: true } });
    results.phones = data; total += data.length;
  }

  if (!filterType || filterType === "evidence") {
    const data = await prisma.evidence.findMany({ where: { OR: [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { extractedText: { contains: query, mode: "insensitive" } },
    ]}, take, skip, select: { id: true, title: true, type: true, caseId: true } });
    results.evidence = data; total += data.length;
  }

  if (!filterType || filterType === "notes") {
    const data = await prisma.note.findMany({ where: {
      content: { contains: query, mode: "insensitive" },
    }, take, skip, select: { id: true, content: true, caseId: true, createdAt: true, user: { select: { name: true } } } });
    results.notes = data; total += data.length;
  }

  await prisma.auditLog.create({
    data: { userId: req.userId, action: "SEARCH", entity: "global",
      details: { query, type: filterType || "all", resultsCount: total } },
  });

  res.json({ ...results, total, page: parseInt(page as string), limit: take });
});
