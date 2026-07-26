import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Users, Search, Brain, Banknote, Microscope, Binary, Scale } from "lucide-react";

const ICONS: Record<string, any> = { investigation: Search, financial: Banknote, forensic: Microscope, cyber: Binary, behavioral: Brain, legal: Scale };

export default function AgentsPage() {
  const { data } = useQuery({ queryKey: ["agents-status"], queryFn: () => api.get<any>("/agents/status").catch(() => ({ agents: [] })) });

  return (
    <div className="p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <Users size={19} className="text-sherlock-cyan" />
        <h1 className="font-mono text-lg tracking-wide font-bold">Multi-Agent Conference</h1>
      </div>
      <p className="text-xs text-sherlock-mut mb-4">Six specialist models collaborate on every case. Run analysis from any case detail page.</p>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {(data?.agents || []).map((a: any) => {
          const Icon = ICONS[a.id] || Brain;
          return (
            <div key={a.id} className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
              <div className="rounded-lg flex items-center justify-center w-10 h-10" style={{ background: "#111A2D", border: "1px solid #27334F" }}>
                <Icon size={18} className="text-sherlock-cyan" />
              </div>
              <div>
                <div className="text-sm font-semibold">{a.name}</div>
                <div className="text-[10px] font-mono flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-sherlock-green" />
                  <span className="text-sherlock-green">{a.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
