import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { FileText, User, Car, Phone, Landmark, Sparkles, Send, Brain, Play } from "lucide-react";
import { useState } from "react";

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: c, isLoading } = useQuery({ queryKey: ["case", id], queryFn: () => api.get<any>(`/cases/${id}`) });
  const [note, setNote] = useState("");
  const addNote = useMutation({
    mutationFn: (content: string) => api.post(`/cases/${id}/notes`, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["case", id] }); setNote(""); },
  });
  const [agentResult, setAgentResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const runAgents = async () => {
    setRunning(true);
    try {
      const r = await api.post<any>("/agents/analyze", { caseId: id });
      setAgentResult(r);
    } finally { setRunning(false); }
  };

  if (isLoading) return <div className="p-6 text-sherlock-mut">Loading case…</div>;
  if (!c) return <div className="p-6 text-sherlock-mut">Case not found</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <FileText size={17} className="text-sherlock-steel" />
        <span className="font-mono text-xs text-sherlock-steel">{c.firNumber}</span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono"
          style={{ background: "#5B8DEF18", color: "#5B8DEF" }}>{c.status}</span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono"
          style={{ background: c.priority === "CRITICAL" ? "#FF4D6D18" : "#FBBF2418",
            color: c.priority === "CRITICAL" ? "#FF4D6D" : "#FBBF24" }}>{c.priority}</span>
      </div>
      <h1 className="text-xl font-bold mb-1">{c.title}</h1>
      <p className="text-xs text-sherlock-mut mb-5">{c.station} · {c.district} · {new Date(c.dateOfOffence).toLocaleDateString()}</p>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 340px" }}>
        <div className="flex flex-col gap-4">
          {/* Description */}
          <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
            <span className="font-mono text-[10px] tracking-widest text-sherlock-steel uppercase">Description</span>
            <p className="text-sm text-sherlock-dim mt-2 leading-relaxed">{c.description}</p>
            {c.estimatedLoss && <div className="mt-3 text-sm"><span className="text-sherlock-mut">Loss:</span> <span className="text-sherlock-amber font-mono">{c.estimatedLoss}</span></div>}
          </div>

          {/* Linked entities */}
          <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
            <span className="font-mono text-[10px] tracking-widest text-sherlock-steel uppercase">Linked entities</span>
            <div className="flex flex-wrap gap-2 mt-3">
              {c.suspects?.map((s: any) => (
                <span key={s.id} className="px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs bg-sherlock-bg2 border border-sherlock-line">
                  <User size={12} className="text-sherlock-red" />{s.person.name} <span className="text-sherlock-mut">({s.role})</span>
                </span>
              ))}
              {c.vehicles?.map((v: any) => (
                <span key={v.id} className="px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs bg-sherlock-bg2 border border-sherlock-line">
                  <Car size={12} className="text-sherlock-amber" />{v.vehicle.registration}
                </span>
              ))}
              {c.phones?.map((p: any) => (
                <span key={p.id} className="px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs bg-sherlock-bg2 border border-sherlock-line">
                  <Phone size={12} className="text-sherlock-cyan" />{p.phone.number}
                </span>
              ))}
              {c.bankAccounts?.map((b: any) => (
                <span key={b.id} className="px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs bg-sherlock-bg2 border border-sherlock-line">
                  <Landmark size={12} className="text-sherlock-green" />{b.bankAccount.bankName}
                </span>
              ))}
            </div>
          </div>

          {/* Timeline */}
          {c.timelineEvents?.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
              <span className="font-mono text-[10px] tracking-widest text-sherlock-steel uppercase">Timeline</span>
              <div className="mt-3 pl-4 border-l-2 border-sherlock-line flex flex-col gap-3">
                {c.timelineEvents.map((e: any) => (
                  <div key={e.id} className="relative">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-sherlock-panelHi border-2 border-sherlock-steel" />
                    <div className="font-mono text-[10px] text-sherlock-steel">{new Date(e.timestamp).toLocaleString()}</div>
                    <div className="text-sm font-semibold mt-0.5">{e.title}</div>
                    {e.description && <div className="text-xs text-sherlock-dim mt-1">{e.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Agent Analysis */}
          <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-widest text-sherlock-cyan uppercase flex items-center gap-2">
                <Brain size={14} className="text-sherlock-cyan" /> Multi-Agent Analysis
              </span>
              <button onClick={runAgents} disabled={running}
                className="px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold disabled:opacity-50"
                style={{ background: "#22D3EE", color: "#05070E" }}>
                <Play size={13} /> {running ? "Analysing…" : "Run agents"}
              </button>
            </div>
            {agentResult && (
              <div className="flex flex-col gap-2 animate-rise-in">
                {agentResult.agents?.map((a: any) => (
                  <div key={a.agentId} className="p-3 rounded-lg bg-sherlock-bg2 border border-sherlock-line">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-sherlock-steel">{a.agentName}</span>
                      <span className="text-xs font-mono" style={{ color: a.confidence > 0.7 ? "#34D399" : "#6B7A98" }}>
                        {Math.round(a.confidence * 100)}%
                      </span>
                    </div>
                    <div className="text-sm text-sherlock-text mt-1">{a.finding}</div>
                    {a.evidence.length > 0 && (
                      <div className="text-[10px] text-sherlock-mut mt-1 font-mono">{a.evidence.slice(0, 3).join(" · ")}</div>
                    )}
                  </div>
                ))}
                <div className="p-3 rounded-lg mt-1" style={{ background: "#34D39912", border: "1px solid #34D39955" }}>
                  <div className="text-sm font-semibold text-sherlock-green">Consensus: {agentResult.overallConfidence}%</div>
                  <div className="text-xs text-sherlock-dim mt-1">{agentResult.consensus}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {agentResult.recommendations?.map((r: string, i: number) => (
                      <span key={i} className="px-2 py-1 rounded text-[10px] bg-sherlock-bg2 border border-sherlock-line">
                        <Sparkles size={10} className="text-sherlock-amber inline mr-1" />{r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Evidence */}
          <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
            <span className="font-mono text-[10px] tracking-widest text-sherlock-steel uppercase">Evidence ({c.evidence?.length || 0})</span>
            <div className="flex flex-col gap-1.5 mt-2">
              {c.evidence?.map((e: any) => (
                <div key={e.id} className="px-2.5 py-1.5 rounded-lg bg-sherlock-bg2 border border-sherlock-line text-xs">
                  <div className="text-sherlock-text">{e.title}</div>
                  <div className="text-[10px] text-sherlock-mut">{e.type}</div>
                </div>
              ))}
              {!c.evidence?.length && <div className="text-xs text-sherlock-mut">No evidence uploaded yet.</div>}
            </div>
          </div>

          {/* Assignments */}
          <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
            <span className="font-mono text-[10px] tracking-widest text-sherlock-steel uppercase">Assigned officers</span>
            <div className="flex flex-col gap-1.5 mt-2">
              {c.assignments?.map((a: any) => (
                <div key={a.id} className="text-xs text-sherlock-dim">{a.user.name} ({a.user.rank})</div>
              ))}
              {!c.assignments?.length && <div className="text-xs text-sherlock-mut">No officers assigned.</div>}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
            <span className="font-mono text-[10px] tracking-widest text-sherlock-steel uppercase">Notes</span>
            <div className="flex flex-col gap-2 mt-2 mb-3">
              {c.notes?.map((n: any) => (
                <div key={n.id} className="p-2 rounded-lg bg-sherlock-bg2 border border-sherlock-line text-xs">
                  <div className="text-sherlock-text">{n.content}</div>
                  <div className="text-[10px] text-sherlock-mut mt-1">{n.user.name} · {new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…"
                onKeyDown={(e) => e.key === "Enter" && note.trim() && addNote.mutate(note)}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-sherlock-bg2 border border-sherlock-line text-xs outline-none text-sherlock-text" />
              <button onClick={() => note.trim() && addNote.mutate(note)}
                className="p-1.5 rounded-lg bg-sherlock-steel text-white"><Send size={13} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
