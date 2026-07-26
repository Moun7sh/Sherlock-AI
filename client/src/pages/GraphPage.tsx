import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { GitBranch } from "lucide-react";

export default function GraphPage() {
  const { data } = useQuery({
    queryKey: ["network-discover"],
    queryFn: () => api.get<any>("/network/discover").catch(() => []),
  });

  return (
    <div className="p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <GitBranch size={19} className="text-purple-400" />
        <h1 className="font-mono text-lg tracking-wide font-bold">Knowledge Graph</h1>
      </div>
      <p className="text-xs text-sherlock-mut mb-4">Inferred links discovered by the autonomous analysis engine</p>

      <div className="rounded-xl overflow-hidden" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #1A2338" }}>
              {["Source", "→", "Target", "Relation", "Confidence", "Inferred"].map(h => (
                <th key={h} className="text-left px-4 py-2 font-mono text-[10px] tracking-widest text-sherlock-mut uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data || []).map((l: any) => (
              <tr key={l.id} style={{ borderBottom: "1px solid #FFFFFF06" }}>
                <td className="px-4 py-2.5 text-xs font-mono text-sherlock-steel">{l.sourceType}:{l.sourceId.slice(-6)}</td>
                <td className="px-4 py-2.5 text-sherlock-mut">→</td>
                <td className="px-4 py-2.5 text-xs font-mono text-sherlock-steel">{l.targetType}:{l.targetId.slice(-6)}</td>
                <td className="px-4 py-2.5 text-xs text-sherlock-dim">{l.relation}</td>
                <td className="px-4 py-2.5 text-xs font-mono" style={{ color: (l.confidence || 0) > 0.8 ? "#34D399" : "#FBBF24" }}>
                  {l.confidence ? `${Math.round(l.confidence * 100)}%` : "—"}
                </td>
                <td className="px-4 py-2.5">
                  {l.isInferred && <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: "#FF4D6D18", color: "#FF4D6D" }}>AI</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!data || data.length === 0) && (
          <div className="px-4 py-8 text-center text-sm text-sherlock-mut">No inferred links yet. Run the agent pipeline on a case to generate them.</div>
        )}
      </div>
    </div>
  );
}
