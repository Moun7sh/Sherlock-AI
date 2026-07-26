import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Clock, Play, Pause, SkipBack, FileText, User, Car, Phone, Landmark,
  Radio, Microscope, Gavel, ChevronRight } from "lucide-react";

const KIND: Record<string, [string, any]> = {
  fir: ["#5B8DEF", FileText], statement: ["#22D3EE", User], cdr: ["#22D3EE", Radio],
  evidence: ["#FBBF24", Microscope], financial: ["#34D399", Landmark], arrest: ["#FF4D6D", Gavel],
};

export default function TimelinePage() {
  const { data: cases } = useQuery({ queryKey: ["cases-tl"], queryFn: () => api.get<any>("/cases?limit=50") });
  const [caseId, setCaseId] = useState<string | null>(null);
  const { data: events } = useQuery({
    queryKey: ["timeline", caseId], enabled: !!caseId,
    queryFn: () => api.get<any[]>(`/cases/${caseId}/timeline`),
  });

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!playing || !events) return;
    if (idx >= events.length - 1) { setPlaying(false); return; }
    timerRef.current = setTimeout(() => setIdx(i => i + 1), 1200);
    return () => clearTimeout(timerRef.current);
  }, [playing, idx, events]);

  useEffect(() => { if (cases?.data?.[0]) setCaseId(cases.data[0].id); }, [cases]);
  useEffect(() => { setIdx(0); setPlaying(false); }, [caseId]);

  const shown = events?.slice(0, idx + 1) || [];

  return (
    <div className="p-6">
      <div className="flex items-center gap-2.5 mb-1">
        <Clock size={19} className="text-sherlock-cyan" />
        <h1 className="font-mono text-lg tracking-wide font-bold">Investigation Timeline</h1>
      </div>
      <p className="text-xs text-sherlock-mut mb-5 ml-7">Replay the case chronology step by step</p>

      {/* Case selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {cases?.data?.slice(0, 8).map((c: any) => (
          <button key={c.id} onClick={() => setCaseId(c.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
            style={{ background: caseId === c.id ? "#5B8DEF18" : "#0C1220",
              border: `1px solid ${caseId === c.id ? "#5B8DEF" : "#1A2338"}`,
              color: caseId === c.id ? "#E8EEF9" : "#6B7A98" }}>
            {c.firNumber}
          </button>
        ))}
      </div>

      {/* Transport */}
      {events && events.length > 0 && (
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => { setIdx(0); setPlaying(true); }}
            className="p-2.5 rounded-lg" style={{ background: "#111A2D", border: "1px solid #27334F" }}>
            <SkipBack size={15} className="text-sherlock-dim" />
          </button>
          <button onClick={() => setPlaying(p => !p)}
            className="p-2.5 rounded-lg" style={{ background: "#22D3EE", border: "none" }}>
            {playing ? <Pause size={15} color="#05070E" /> : <Play size={15} color="#05070E" />}
          </button>
          <input type="range" min={0} max={(events?.length || 1) - 1} value={idx}
            onChange={e => { setPlaying(false); setIdx(+e.target.value); }}
            className="flex-1" style={{ accentColor: "#22D3EE" }} />
          <span className="font-mono text-xs text-sherlock-dim w-12 text-right">{idx + 1}/{events?.length}</span>
        </div>
      )}

      {/* Timeline */}
      <div className="relative pl-8">
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5" style={{ background: "linear-gradient(#5B8DEF, #1A2338)" }} />
        {shown.map((e: any, i: number) => {
          const [col, Icon] = KIND[e.eventType] || ["#6B7A98", FileText];
          const isLast = i === shown.length - 1;
          return (
            <div key={e.id} className="relative mb-4" style={{ animation: isLast ? "rise-in .45s ease" : undefined }}>
              <div className="absolute -left-8 top-1 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#111A2D", border: `2px solid ${col}`,
                  boxShadow: isLast ? `0 0 16px -4px ${col}` : undefined }}>
                <Icon size={14} color={col} />
              </div>
              <div className="rounded-xl p-4 ml-3" style={{ background: "#0C1220", border: `1px solid ${isLast ? col + "55" : "#1A2338"}` }}>
                <div className="font-mono text-[10px] tracking-wider" style={{ color: col }}>
                  {new Date(e.timestamp).toLocaleString()}
                </div>
                <div className="text-sm font-semibold mt-1">{e.title}</div>
                {e.description && <div className="text-xs text-sherlock-dim mt-1.5 leading-relaxed">{e.description}</div>}
              </div>
            </div>
          );
        })}
        {(!events || events.length === 0) && !caseId && (
          <div className="text-sm text-sherlock-mut py-8">Select a case above to view its timeline.</div>
        )}
        {caseId && events?.length === 0 && (
          <div className="text-sm text-sherlock-mut py-8">No timeline events for this case.</div>
        )}
      </div>
    </div>
  );
}
