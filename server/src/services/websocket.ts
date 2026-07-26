import { WebSocketServer, WebSocket } from "ws";
import { prisma } from "../lib/prisma";

interface Client {
  ws: WebSocket;
  userId?: string;
  channels: Set<string>;
}

const clients = new Map<WebSocket, Client>();

export function broadcast(channel: string, type: string, data: any) {
  const msg = JSON.stringify({ channel, type, data, timestamp: new Date().toISOString() });
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN && (channel === "global" || client.channels.has(channel))) {
      client.ws.send(msg);
    }
  });
}

export function notifyUser(userId: string, type: string, data: any) {
  const msg = JSON.stringify({ channel: "notification", type, data, timestamp: new Date().toISOString() });
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN && client.userId === userId) {
      client.ws.send(msg);
    }
  });
}

export function setupWebSocket(wss: WebSocketServer) {
  wss.on("connection", (ws) => {
    const client: Client = { ws, channels: new Set(["global"]) };
    clients.set(ws, client);
    ws.send(JSON.stringify({ type: "connected", message: "Sherlock AI connected", timestamp: new Date().toISOString() }));

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        switch (msg.type) {
          case "authenticate":
            client.userId = msg.userId;
            client.channels.add(`user:${msg.userId}`);
            break;
          case "subscribe":
            if (msg.channel) client.channels.add(msg.channel);
            break;
          case "unsubscribe":
            if (msg.channel) client.channels.delete(msg.channel);
            break;
        }
      } catch { /* ignore malformed messages */ }
    });

    ws.on("close", () => clients.delete(ws));
    ws.on("error", () => clients.delete(ws));
  });

  // Autonomous discovery feed — runs real queries against the database
  let discoveryIdx = 0;
  setInterval(async () => {
    try {
      const discoveries = await runDiscoveryCheck(discoveryIdx);
      discoveries.forEach((d) => broadcast("global", "discovery", d));
      discoveryIdx++;
    } catch { /* swallow — don't crash the interval */ }
  }, 8000);
}

async function runDiscoveryCheck(idx: number) {
  const checks = [
    async () => {
      const shared = await prisma.caseVehicle.groupBy({ by: ["vehicleId"], _count: true, having: { vehicleId: { _count: { gt: 1 } } } });
      if (shared.length > 0) {
        const v = await prisma.vehicle.findUnique({ where: { id: shared[0].vehicleId } });
        return { type: "vehicle_reuse", title: "Vehicle reused across cases", detail: `${v?.registration} appears in ${shared[0]._count} cases` };
      }
      return null;
    },
    async () => {
      const shared = await prisma.personPhone.groupBy({ by: ["phoneId"], _count: true, having: { phoneId: { _count: { gt: 1 } } } });
      if (shared.length > 0) {
        const p = await prisma.phoneNumber.findUnique({ where: { id: shared[0].phoneId } });
        return { type: "shared_phone", title: "Shared mobile handset", detail: `${p?.number} attributed to ${shared[0]._count} persons` };
      }
      return null;
    },
    async () => {
      const inferred = await prisma.networkLink.findMany({ where: { isInferred: true }, orderBy: { confidence: "desc" }, take: 1 });
      if (inferred.length > 0) {
        return { type: "network_link", title: "AI-inferred link", detail: `${inferred[0].relation} (${Math.round((inferred[0].confidence || 0) * 100)}% confidence)` };
      }
      return null;
    },
    async () => {
      const recent = await prisma.case.findFirst({ orderBy: { createdAt: "desc" }, select: { firNumber: true, crimeType: true } });
      if (recent) return { type: "case_activity", title: "Latest case", detail: `${recent.firNumber}: ${recent.crimeType}` };
      return null;
    },
  ];

  const check = checks[idx % checks.length];
  const result = await check();
  return result ? [result] : [];
}
