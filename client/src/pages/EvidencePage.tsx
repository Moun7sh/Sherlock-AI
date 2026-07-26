import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Microscope, Upload, FileText, Image, Video, Shield, ChevronRight, Hash } from "lucide-react";

const TYPE_ICONS: Record<string, any> = { DOCUMENT: FileText, IMAGE: Image, VIDEO: Video, PHYSICAL: Shield, FORENSIC: Microscope };
const TYPE_COLORS: Record<string, string> = { DOCUMENT: "#5B8DEF", IMAGE: "#A78BFA", VIDEO: "#22D3EE", PHYSICAL: "#FBBF24", FORENSIC: "#34D399" };

export default function EvidencePage() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const { data, isLoading } = useQuery({
    queryKey: ["evidence", typeFilter],
    queryFn: () => api.get<any>(`/evidence?limit=50${typeFilter ? `&type=${typeFilter}` : ""}`),
  });

  const types = ["", "DOCUMENT", "IMAGE", "VIDEO", "PHYSICAL", "FORENSIC"];

  return (
    <div className="p-6">
      <div className="flex items-center gap-2.5 mb-1">
        <Microscope size={19} className="text-purple-400" />
        <h1 className="font-mono text-lg tracking-wide font-bold">Evidence Explorer</h1>
      </div>
      <p className="text-xs text-sherlock-mut mb-5 ml-7">Browse, filter and inspect all evidence across cases</p>

      {/* Type filters */}
      <div className="flex gap-2 mb-4">
        {types.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
            style={{ background: typeFilter === t ? "#A78BFA18" : "#0C1220",
              border: `1px solid ${typeFilter === t ? "#A78BFA" : "#1A2338"}`,
              color: typeFilter === t ? "#E8EEF9" : "#6B7A98" }}>
            {t || "All"}
          </button>
        ))}
      </div>

      {/* Evidence grid */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {data?.data?.map((e: any) => {
          const Icon = TYPE_ICONS[e.type] || FileText;
          const color = TYPE_COLORS[e.type] || "#6B7A98";
          return (
            <div key={e.id} className="rounded-xl p-4 hover:border-purple-500/50 transition-all cursor-pointer"
              style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
              <div className="flex items-start gap-3">
                <div className="rounded-lg flex items-center justify-center w-10 h-10 shrink-0"
                  style={{ background: "#111A2D", border: `1px solid ${color}44` }}>
                  <Icon size={18} color={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{e.title}</div>
                  <div className="text-[10px] text-sherlock-mut mt-0.5">{e.type} · {e.case?.firNumber || "—"}</div>
                  {e.description && <div className="text-xs text-sherlock-dim mt-1.5 line-clamp-2">{e.description}</div>}
                </div>
              </div>
              {/* Chain of custody */}
              {e.chainOfCustody && Array.isArray(e.chainOfCustody) && e.chainOfCustody.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid #1A2338" }}>
                  <span className="font-mono text-[9px] tracking-widest uppercase text-sherlock-mut">Chain of custody</span>
                  <div className="flex flex-col gap-1 mt-1.5">
                    {(e.chainOfCustody as any[]).slice(0, 3).map((c: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-sherlock-green" />
                        <span className="text-sherlock-dim">{c.action}</span>
                        <span className="text-sherlock-mut ml-auto">{c.timestamp ? new Date(c.timestamp).toLocaleDateString() : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Hash */}
              {e.hash && (
                <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono text-sherlock-mut">
                  <Hash size={10} /> {e.hash.slice(0, 16)}…
                </div>
              )}
            </div>
          );
        })}
      </div>
      {isLoading && <div className="text-center py-8 text-sm text-sherlock-mut">Loading evidence…</div>}
      {!isLoading && (!data?.data || data.data.length === 0) && (
        <div className="text-center py-8 text-sm text-sherlock-mut">No evidence items found. Upload evidence from a case detail page.</div>
      )}
      {data?.total > 0 && <div className="mt-3 text-xs text-sherlock-mut text-right">{data.total} total items</div>}
    </div>
  );
}
