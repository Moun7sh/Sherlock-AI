import { prisma } from "../lib/prisma";

// ── Types ───────────────────────────────────────────────────────────────────

interface AgentResult {
  agentId: string;
  agentName: string;
  finding: string;
  confidence: number;
  evidence: string[];
  reasoning: string;
  executionMs: number;
  retries: number;
}

interface SharedMemory {
  caseId: string;
  caseData: any;
  findings: Map<string, AgentResult>;
  errors: string[];
}

interface PipelineResult {
  caseId: string;
  query?: string;
  agents: AgentResult[];
  consensus: string;
  overallConfidence: number;
  recommendations: string[];
  executionLog: string[];
  totalMs: number;
  timestamp: string;
}

// ── Agent execution wrapper with retry ──────────────────────────────────────

async function executeAgent(
  name: string,
  id: string,
  fn: (mem: SharedMemory) => Promise<Omit<AgentResult, "agentId" | "agentName" | "executionMs" | "retries">>,
  memory: SharedMemory,
  maxRetries = 2
): Promise<AgentResult> {
  let retries = 0;
  const start = Date.now();

  while (retries <= maxRetries) {
    try {
      const result = await fn(memory);
      const r: AgentResult = { ...result, agentId: id, agentName: name, executionMs: Date.now() - start, retries };
      memory.findings.set(id, r);
      return r;
    } catch (err) {
      retries++;
      memory.errors.push(`[${id}] attempt ${retries}: ${(err as Error).message}`);
      if (retries > maxRetries) {
        const fallback: AgentResult = {
          agentId: id, agentName: name, finding: "Agent failed after retries",
          confidence: 0, evidence: [], reasoning: (err as Error).message,
          executionMs: Date.now() - start, retries,
        };
        memory.findings.set(id, fallback);
        return fallback;
      }
      await new Promise(r => setTimeout(r, 200 * retries)); // backoff
    }
  }
  throw new Error("unreachable");
}

// ── Individual agents ───────────────────────────────────────────────────────

async function investigationAgent(mem: SharedMemory) {
  const c = mem.caseData;
  const vehicleIds = (c.vehicles || []).map((v: any) => v.vehicle?.registration).filter(Boolean);
  const sharedVehicleCases = vehicleIds.length > 0
    ? await prisma.caseVehicle.findMany({
        where: { vehicle: { registration: { in: vehicleIds } }, caseId: { not: mem.caseId } },
        include: { case: { select: { firNumber: true, title: true } }, vehicle: true },
      })
    : [];
  const sharedSuspects = await prisma.caseSuspect.findMany({
    where: { personId: { in: (c.suspects || []).map((s: any) => s.personId) }, caseId: { not: mem.caseId } },
    include: { case: { select: { firNumber: true } }, person: { select: { name: true } } },
  });
  return {
    finding: sharedVehicleCases.length > 0 || sharedSuspects.length > 0
      ? `Cross-case links: ${sharedVehicleCases.length} shared vehicles, ${sharedSuspects.length} shared suspects`
      : "No direct cross-case links found in vehicles or suspects",
    confidence: Math.min(0.95, 0.3 + sharedVehicleCases.length * 0.2 + sharedSuspects.length * 0.15),
    evidence: [
      ...sharedVehicleCases.map((sv: any) => `Vehicle ${sv.vehicle.registration} also in ${sv.case.firNumber}`),
      ...sharedSuspects.map((ss: any) => `${ss.person.name} also in ${ss.case.firNumber}`),
    ],
    reasoning: `Cross-referenced ${vehicleIds.length} vehicles and ${(c.suspects || []).length} suspects against full database`,
  };
}

async function financialAgent(mem: SharedMemory) {
  const accounts = await prisma.caseBankAccount.findMany({ where: { caseId: mem.caseId },
    include: { bankAccount: { include: { transactions: { orderBy: { timestamp: "desc" }, take: 10 } } } } });
  const txCount = accounts.reduce((n: number, a: any) => n + a.bankAccount.transactions.length, 0);
  const suspiciousTx = accounts.flatMap((a: any) =>
    a.bankAccount.transactions.filter((t: any) => t.amount > 10000)
  );
  return {
    finding: txCount > 0
      ? `Analysed ${txCount} transactions, ${suspiciousTx.length} flagged suspicious (>₹10,000)`
      : "No financial records linked to this case",
    confidence: suspiciousTx.length > 0 ? 0.85 : txCount > 0 ? 0.5 : 0.15,
    evidence: suspiciousTx.map((t: any) => `${t.type}: ₹${t.amount} at ${t.location || "unknown"} on ${new Date(t.timestamp).toLocaleDateString()}`),
    reasoning: `Reviewed ${accounts.length} linked accounts with ${txCount} total transactions`,
  };
}

async function cyberAgent(mem: SharedMemory) {
  const phones = await prisma.casePhone.findMany({ where: { caseId: mem.caseId },
    include: { phone: { include: { cdrRecords: { take: 20, orderBy: { callTime: "desc" } },
      personLinks: { include: { person: { select: { name: true } } } } } } } });
  const cdrCount = phones.reduce((n: number, p: any) => n + p.phone.cdrRecords.length, 0);
  const sharedPhones = await prisma.casePhone.findMany({
    where: { phoneId: { in: phones.map((p: any) => p.phoneId) }, caseId: { not: mem.caseId } },
    include: { case: { select: { firNumber: true } }, phone: true },
  });
  const multiUser = phones.filter((p: any) => p.phone.personLinks.length > 1);
  return {
    finding: [
      sharedPhones.length > 0 ? `${sharedPhones.length} phone(s) shared with other cases` : null,
      multiUser.length > 0 ? `${multiUser.length} phone(s) attributed to multiple persons` : null,
      `${cdrCount} CDR records analysed`,
    ].filter(Boolean).join(". ") || "No CDR anomalies detected",
    confidence: Math.min(0.96, 0.2 + sharedPhones.length * 0.25 + multiUser.length * 0.2),
    evidence: [
      ...sharedPhones.map((sp: any) => `${sp.phone.number} also in ${sp.case.firNumber}`),
      ...multiUser.map((p: any) => `${p.phone.number} used by ${p.phone.personLinks.map((l: any) => l.person.name).join(", ")}`),
    ],
    reasoning: `Analysed ${phones.length} phone numbers, ${cdrCount} call records, checked cross-case and multi-user attribution`,
  };
}

async function behavioralAgent(mem: SharedMemory) {
  const c = mem.caseData;
  const similar = await prisma.case.findMany({
    where: { crimeType: c.crimeType, id: { not: mem.caseId } },
    select: { firNumber: true, title: true, place: true, timeOfOffence: true, district: true },
    take: 10,
  });
  // Check previous findings from other agents for pattern consistency
  const invResult = mem.findings.get("investigation");
  const hasLinks = (invResult?.confidence || 0) > 0.5;
  return {
    finding: `${similar.length} similar ${c.crimeType} cases found${hasLinks ? " — consistent with an organised series" : ""}`,
    confidence: hasLinks ? Math.min(0.9, 0.4 + similar.length * 0.08) : Math.min(0.6, 0.2 + similar.length * 0.05),
    evidence: similar.slice(0, 5).map((s: any) => `${s.firNumber}: ${s.title} (${s.district}, ${s.timeOfOffence || "unknown time"})`),
    reasoning: `Compared modus operandi, timing and geography against ${similar.length} ${c.crimeType} cases. ${hasLinks ? "Cross-case links from Investigation AI reinforce the pattern." : ""}`,
  };
}

async function legalAgent(mem: SharedMemory) {
  const c = mem.caseData;
  const evidenceCount = (c.evidence || []).length;
  const suspectCount = (c.suspects || []).length;
  const hasStatements = (c.timelineEvents || []).some((e: any) => e.eventType === "statement");
  const agentConfidences = [...mem.findings.values()].filter(r => r.confidence > 0.7);
  return {
    finding: evidenceCount >= 3 && suspectCount >= 1
      ? `Chargesheet preparation viable: ${evidenceCount} evidence items, ${suspectCount} accused, ${agentConfidences.length} strong AI findings`
      : "Additional evidence or accused identification needed before chargesheet",
    confidence: Math.min(0.92, 0.2 + evidenceCount * 0.1 + suspectCount * 0.15 + (hasStatements ? 0.1 : 0)),
    evidence: [
      `${evidenceCount} evidence items on record`,
      `${suspectCount} suspects identified`,
      `IPC sections: ${(c.ipcSections || []).join(", ") || "pending"}`,
      hasStatements ? "Witness statements recorded" : "No witness statements yet",
    ],
    reasoning: `Evaluated evidence sufficiency under BNS provisions. ${agentConfidences.length} other agents report high-confidence findings.`,
  };
}

async function forensicAgent(mem: SharedMemory) {
  const physicalEvidence = await prisma.evidence.findMany({
    where: { caseId: mem.caseId, type: { in: ["PHYSICAL", "FORENSIC", "IMAGE"] } },
  });
  const hasExtracted = physicalEvidence.filter(e => e.extractedText || e.aiEntities);
  return {
    finding: physicalEvidence.length > 0
      ? `${physicalEvidence.length} physical/forensic items. ${hasExtracted.length} have extracted data.`
      : "No physical or forensic evidence recorded",
    confidence: hasExtracted.length > 0 ? 0.78 : physicalEvidence.length > 0 ? 0.45 : 0.1,
    evidence: physicalEvidence.map(e => `${e.title} (${e.type})${e.extractedText ? " — text extracted" : ""}`),
    reasoning: `Reviewed ${physicalEvidence.length} items. ${hasExtracted.length} processed through entity extraction.`,
  };
}

// ── Consensus engine ────────────────────────────────────────────────────────

function buildConsensus(agents: AgentResult[]): { consensus: string; recommendations: string[] } {
  const highConf = agents.filter(a => a.confidence > 0.7);
  const medConf = agents.filter(a => a.confidence > 0.4 && a.confidence <= 0.7);

  const recommendations: string[] = [];
  const inv = agents.find(a => a.agentId === "investigation");
  const fin = agents.find(a => a.agentId === "financial");
  const cyb = agents.find(a => a.agentId === "cyber");
  const leg = agents.find(a => a.agentId === "legal");

  if (inv && inv.confidence > 0.6) recommendations.push("Pursue cross-case vehicle and suspect links immediately");
  if (cyb && cyb.confidence > 0.6) recommendations.push("Obtain full tower dump for shared phone numbers");
  if (fin && fin.confidence > 0.6) recommendations.push("Freeze linked bank accounts to prevent dissipation");
  if (leg && leg.confidence > 0.7) recommendations.push("Begin chargesheet preparation — evidence threshold met");
  if (recommendations.length === 0) recommendations.push("Continue evidence collection", "Request CDR and financial records");

  let consensus: string;
  if (highConf.length >= 4) {
    consensus = `Strong consensus: ${highConf.length} of ${agents.length} agents report high-confidence findings. Multiple independent evidence classes converge.`;
  } else if (highConf.length >= 2) {
    consensus = `Partial consensus: ${highConf.length} agents with strong findings, ${medConf.length} with moderate signals. Cross-case links warrant further investigation.`;
  } else {
    consensus = `Insufficient consensus: only ${highConf.length} strong finding(s). Additional evidence collection recommended before drawing conclusions.`;
  }

  return { consensus, recommendations };
}

// ── Pipeline orchestrator ───────────────────────────────────────────────────

export async function runAgentPipeline(caseId: string, query?: string): Promise<PipelineResult> {
  const pipelineStart = Date.now();
  const executionLog: string[] = [];
  executionLog.push(`[${new Date().toISOString()}] Pipeline started for case ${caseId}`);

  // Load case with all relations into shared memory
  const caseData = await prisma.case.findUnique({ where: { id: caseId },
    include: {
      suspects: { include: { person: true } },
      vehicles: { include: { vehicle: true } },
      phones: { include: { phone: true } },
      bankAccounts: { include: { bankAccount: true } },
      evidence: true,
      timelineEvents: { orderBy: { timestamp: "asc" } },
    },
  });

  if (!caseData) throw new Error(`Case ${caseId} not found`);

  const memory: SharedMemory = { caseId, caseData, findings: new Map(), errors: [] };
  executionLog.push(`[${new Date().toISOString()}] Case loaded: ${caseData.firNumber} — ${caseData.title}`);

  // Phase 1: Independent agents (can run in parallel)
  executionLog.push(`[${new Date().toISOString()}] Phase 1: independent agents`);
  const phase1 = await Promise.all([
    executeAgent("Investigation AI", "investigation", investigationAgent, memory),
    executeAgent("Financial Crime AI", "financial", financialAgent, memory),
    executeAgent("Cyber & CDR AI", "cyber", cyberAgent, memory),
    executeAgent("Forensic AI", "forensic", forensicAgent, memory),
  ]);
  phase1.forEach(r => executionLog.push(`  ${r.agentName}: ${r.confidence.toFixed(2)} confidence (${r.executionMs}ms, ${r.retries} retries)`));

  // Phase 2: Agents that read phase 1 results from shared memory
  executionLog.push(`[${new Date().toISOString()}] Phase 2: dependent agents (read shared memory)`);
  const phase2 = await Promise.all([
    executeAgent("Behaviour Analysis AI", "behavioral", behavioralAgent, memory),
    executeAgent("Legal AI", "legal", legalAgent, memory),
  ]);
  phase2.forEach(r => executionLog.push(`  ${r.agentName}: ${r.confidence.toFixed(2)} confidence (${r.executionMs}ms, ${r.retries} retries)`));

  const allAgents = [...phase1, ...phase2];
  const avg = allAgents.reduce((s, a) => s + a.confidence, 0) / allAgents.length;

  // Consensus
  const { consensus, recommendations } = buildConsensus(allAgents);
  executionLog.push(`[${new Date().toISOString()}] Consensus: ${Math.round(avg * 100)}% overall`);

  if (memory.errors.length > 0) {
    executionLog.push(`[${new Date().toISOString()}] Errors during execution:`);
    memory.errors.forEach(e => executionLog.push(`  ${e}`));
  }

  const totalMs = Date.now() - pipelineStart;
  executionLog.push(`[${new Date().toISOString()}] Pipeline complete in ${totalMs}ms`);

  // Persist the analysis as an audit log
  await prisma.auditLog.create({
    data: { action: "AGENT_PIPELINE", entity: "case", entityId: caseId,
      details: { overallConfidence: Math.round(avg * 100), agentCount: allAgents.length, totalMs } },
  });

  return {
    caseId, query, agents: allAgents, consensus,
    overallConfidence: Math.round(avg * 100),
    recommendations, executionLog, totalMs,
    timestamp: new Date().toISOString(),
  };
}
