import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { getParamString } from "../utils/query";

export const networkRouter = Router();
networkRouter.use(authenticate);

networkRouter.get("/graph/:caseId", async (req: AuthRequest, res: Response) => {
  const caseId = getParamString(req.params.caseId);
  if (!caseId) return res.status(400).json({ error: "Invalid case id" });
  const c = await prisma.case.findUnique({ where: { id: caseId },
    include: { suspects: { include: { person: true } }, vehicles: { include: { vehicle: true } },
      phones: { include: { phone: true } }, bankAccounts: { include: { bankAccount: true } } } });
  if (!c) return res.status(404).json({ error: "Case not found" });
  const nodes: any[] = [{ id: c.id, type: "case", label: c.firNumber, data: c }];
  const edges: any[] = [];
  c.suspects.forEach(s => {
    nodes.push({ id: s.person.id, type: "person", label: s.person.name, data: s.person });
    edges.push({ source: c.id, target: s.person.id, relation: s.role });
  });
  c.vehicles.forEach(v => {
    nodes.push({ id: v.vehicle.id, type: "vehicle", label: v.vehicle.registration, data: v.vehicle });
    edges.push({ source: c.id, target: v.vehicle.id, relation: "vehicle_seen" });
  });
  c.phones.forEach(p => {
    nodes.push({ id: p.phone.id, type: "phone", label: p.phone.number, data: p.phone });
    edges.push({ source: c.id, target: p.phone.id, relation: "phone_traced" });
  });
  const links = await prisma.networkLink.findMany({ where: {
    OR: nodes.map(n => ({ OR: [{ sourceId: n.id }, { targetId: n.id }] })).flat() } });
  links.forEach(l => {
    if (!nodes.find(n => n.id === l.targetId)) {
      nodes.push({ id: l.targetId, type: l.targetType, label: l.targetId });
    }
    edges.push({ source: l.sourceId, target: l.targetId, relation: l.relation,
      isInferred: l.isInferred, confidence: l.confidence });
  });
  res.json({ nodes, edges });
});

networkRouter.get("/discover", async (_req: AuthRequest, res: Response) => {
  const links = await prisma.networkLink.findMany({ where: { isInferred: true },
    orderBy: { confidence: "desc" }, take: 20 });
  res.json(links);
});
