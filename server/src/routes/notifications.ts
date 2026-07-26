import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { getParamString, getQueryString } from "../utils/query";

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get("/", async (req: AuthRequest, res: Response) => {
  if (!req.userId) throw new Error("Missing user context");
  const _limit = getQueryString(req.query.limit) ?? "50";
  const data = await prisma.notification.findMany({ where: { userId: req.userId },
    orderBy: { createdAt: "desc" }, take: parseInt(_limit, 10) });
  const unread = await prisma.notification.count({ where: { userId: req.userId, isRead: false } });
  res.json({ data, unread });
});

notificationsRouter.patch("/:id/read", async (req: AuthRequest, res: Response) => {
  if (!req.userId) throw new Error("Missing user context");
  const notificationId = getParamString(req.params.id);
  if (!notificationId) throw new Error("Invalid notification id");
  await prisma.notification.update({ where: { id: notificationId, userId: req.userId }, data: { isRead: true } });
  res.json({ success: true });
});

notificationsRouter.post("/read-all", async (req: AuthRequest, res: Response) => {
  if (!req.userId) throw new Error("Missing user context");
  await prisma.notification.updateMany({ where: { userId: req.userId, isRead: false }, data: { isRead: true } });
  res.json({ success: true });
});
