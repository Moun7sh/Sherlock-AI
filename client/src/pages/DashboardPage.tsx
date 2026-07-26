import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Activity, FileText, Users, Car, AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<any>("/analytics/dashboard").catch(() => null),
  });

  const stats = [
    { label: "Open Cases", value: data?.openCases ?? "—", icon: FileText, color: "#5B8DEF" },
    { label: "Total Persons", value: data?.totalPersons ?? "—", icon: Users, color: "#FBBF24" },
    { label: "Vehicles Tracked", value: data?.totalVehicles ?? "—", icon: Car, color: "#22D3EE" },
    { label: "High Threat", value: data?.highThreat ?? "—", icon: AlertTriangle, color: "#FF4D6D" },
  ];

  return (
    <div className="p-6">
      <div className="mb-5">
        <div className="flex items-center gap-2.5">
          <Activity size={19} className="text-sherlock-steel" />
          <h1 className="font-mono text-lg tracking-wide font-bold">Investigation Command Center</h1>
        </div>
        <p className="text-xs text-sherlock-mut mt-1 ml-7">Live operational picture · Karnataka State Police</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
            <div className="flex items-start justify-between">
              <span className="font-mono text-[10px] tracking-widest uppercase text-sherlock-steel">{s.label}</span>
              <s.icon size={15} color={s.color} style={{ opacity: 0.8 }} />
            </div>
            <div className="font-mono text-3xl font-semibold mt-2" style={{ color: "#E8EEF9" }}>
              {isLoading ? "…" : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent cases */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #1A2338" }}>
          <span className="font-mono text-[10px] tracking-widest uppercase text-sherlock-steel">Recent cases</span>
          <button onClick={() => navigate("/cases")} className="text-xs text-sherlock-steel flex items-center gap-1">
            View all <ArrowRight size={13} />
          </button>
        </div>
        {data?.recentCases?.map((c: any) => (
          <button key={c.id} onClick={() => navigate(`/cases/${c.id}`)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-sherlock-panelHi transition"
            style={{ borderBottom: "1px solid #1A233822" }}>
            <div>
              <span className="font-mono text-xs text-sherlock-steel">{c.firNumber}</span>
              <div className="text-sm text-sherlock-text mt-0.5">{c.title}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-sherlock-mut">{c.district}</span>
              <div className="text-[10px] text-sherlock-mut mt-0.5">{c.crimeType}</div>
            </div>
          </button>
        ))}
        {!data?.recentCases?.length && !isLoading && (
          <div className="px-4 py-6 text-sm text-sherlock-mut text-center">No cases yet. Create one from the Cases page.</div>
        )}
      </div>

      {/* Wanted */}
      {data?.wantedPersons?.length > 0 && (
        <div className="mt-4 rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
          <span className="font-mono text-[10px] tracking-widest uppercase text-sherlock-red">Wanted persons</span>
          <div className="flex flex-col gap-2 mt-3">
            {data.wantedPersons.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-sherlock-bg2 border border-sherlock-line">
                <Users size={14} className="text-sherlock-red" />
                <div className="flex-1">
                  <div className="text-sm">{p.name}</div>
                  <div className="text-[10px] text-sherlock-mut">alias "{p.alias}" · {p.priorCount} priors</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono"
                  style={{ background: "#FF4D6D18", color: "#FF4D6D" }}>{p.threatLevel}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
