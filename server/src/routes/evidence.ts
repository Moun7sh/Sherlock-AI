import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { upload, fileHash, getFileUrl } from "../services/upload";
import { AppError } from "../middleware/errorHandler";
import { extractEntities } from "../services/extraction";
import { z } from "zod";
import { getParamString, getQueryString } from "../utils/query";

export const evidenceRouter = Router();
evidenceRouter.use(authenticate);

// List evidence (filterable by caseId)
evidenceRouter.get("/", async (req: AuthRequest, res: Response) => {
  const caseId = getQueryString(req.query.caseId);
  const type = getQueryString(req.query.type);
  const page = getQueryString(req.query.page) ?? "1";
  const limit = getQueryString(req.query.limit) ?? "20";
  const where: any = {};
  if (caseId) where.caseId = caseId;
  if (type) where.type = type;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [data, total] = await Promise.all([
    prisma.evidence.findMany({ where, skip, take: parseInt(limit, 10),
      orderBy: { createdAt: "desc" },
      include: { case: { select: { id: true, firNumber: true, title: true } } } }),
    prisma.evidence.count({ where }),
  ]);
  res.json({ data, total });
});

// Get single evidence item
evidenceRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const evidenceId = getParamString(req.params.id);
  if (!evidenceId) throw new AppError(400, "Invalid evidence id");
  const e = await prisma.evidence.findUnique({ where: { id: evidenceId },
    include: { case: { select: { id: true, firNumber: true, title: true } } } });
  if (!e) throw new AppError(404, "Evidence not found");
  res.json(e);
});

// Upload evidence with file
evidenceRouter.post("/upload", upload.single("file"), async (req: AuthRequest, res: Response) => {
  const file = (req as any).file;
  if (!file) throw new AppError(400, "No file provided");

  const hash = fileHash(file.path);
  const fileUrl = getFileUrl(file.filename);

  let extractedText: string | null = null;
  let aiEntities: any = null;

  // Extract text from text-based files
  if (file.mimetype === "text/plain") {
    const fs = await import("fs");
    extractedText = fs.readFileSync(file.path, "utf-8");
  }

  // Run entity extraction if we have text
  if (extractedText) {
    aiEntities = extractEntities(extractedText);
  }

  const evidence = await prisma.evidence.create({
    data: {
      caseId: req.body.caseId,
      type: mapMimeToType(file.mimetype),
      title: req.body.title || file.originalname,
      description: req.body.description || null,
      fileUrl,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      hash,
      extractedText,
      aiEntities,
      collectedBy: req.userId,
      collectedAt: new Date(),
      chainOfCustody: [{
        action: "UPLOADED",
        userId: req.userId,
        timestamp: new Date().toISOString(),
        hash,
      }],
    },
  });

  await prisma.auditLog.create({
    data: { userId: req.userId, action: "UPLOAD_EVIDENCE", entity: "evidence",
      entityId: evidence.id, details: { fileName: file.originalname, size: file.size, hash } },
  });

  res.status(201).json(evidence);
});

// Create evidence without file (metadata only)
evidenceRouter.post("/", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    caseId: z.string().min(1),
    type: z.enum(["DOCUMENT", "IMAGE", "VIDEO", "AUDIO", "PHYSICAL", "DIGITAL", "FORENSIC"]),
    title: z.string().min(1),
    description: z.string().optional(),
    location: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const e = await prisma.evidence.create({
    data: { ...data, collectedBy: req.userId, collectedAt: new Date(),
      chainOfCustody: [{ action: "CREATED", userId: req.userId, timestamp: new Date().toISOString() }] },
  });
  await prisma.auditLog.create({ data: { userId: req.userId, action: "CREATE", entity: "evidence", entityId: e.id } });
  res.status(201).json(e);
});

// Update evidence metadata
evidenceRouter.patch("/:id", async (req: AuthRequest, res: Response) => {
  const evidenceId = getParamString(req.params.id);
  if (!evidenceId) throw new AppError(400, "Invalid evidence id");
  const existing = await prisma.evidence.findUnique({ where: { id: evidenceId } });
  if (!existing) throw new AppError(404, "Evidence not found");
  const e = await prisma.evidence.update({ where: { id: evidenceId }, data: req.body });
  await prisma.auditLog.create({ data: { userId: req.userId, action: "UPDATE", entity: "evidence", entityId: e.id } });
  res.json(e);
});

// Delete evidence
evidenceRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const evidenceId = getParamString(req.params.id);
  if (!evidenceId) throw new AppError(400, "Invalid evidence id");
  const existing = await prisma.evidence.findUnique({ where: { id: evidenceId } });
  if (!existing) throw new AppError(404, "Evidence not found");
  await prisma.evidence.delete({ where: { id: evidenceId } });
  await prisma.auditLog.create({ data: { userId: req.userId, action: "DELETE", entity: "evidence", entityId: evidenceId } });
  res.json({ success: true });
});

function mapMimeToType(mime: string): "DOCUMENT" | "IMAGE" | "VIDEO" | "AUDIO" | "PHYSICAL" | "DIGITAL" | "FORENSIC" {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("audio/")) return "AUDIO";
  return "DOCUMENT";
}
