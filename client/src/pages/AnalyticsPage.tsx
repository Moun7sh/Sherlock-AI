import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Crosshair } from "lucide-react";

export default function AnalyticsPage() {
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<any>("/analytics/dashboard").catch(() => null) });

  return (
    <div className="p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <Crosshair size={19} className="text-sherlock-green" />
        <h1 className="font-mono text-lg tracking-wide font-bold">Crime Analytics</h1>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
          <span className="font-mono text-[10px] tracking-widest text-sherlock-steel uppercase">Crime by type</span>
          <div className="flex flex-col gap-2 mt-3">
            {(data?.crimeByType || []).map((t: any) => (
              <div key={t.crimeType} className="flex items-center gap-3">
                <span className="text-xs text-sherlock-text w-40">{t.crimeType}</span>
                <div className="flex-1 h-2 rounded-full bg-sherlock-bg2 overflow-hidden">
                  <div className="h-full rounded-full bg-sherlock-steel" style={{ width: `${(t._count / (data?.totalCases || 1)) * 100}%` }} />
                </div>
                <span className="text-xs font-mono text-sherlock-dim w-6 text-right">{t._count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
          <span className="font-mono text-[10px] tracking-widest text-sherlock-steel uppercase">Crime by district</span>
          <div className="flex flex-col gap-2 mt-3">
            {(data?.crimeByDistrict || []).map((d: any) => (
              <div key={d.district} className="flex items-center gap-3">
                <span className="text-xs text-sherlock-text w-40">{d.district}</span>
                <div className="flex-1 h-2 rounded-full bg-sherlock-bg2 overflow-hidden">
                  <div className="h-full rounded-full bg-sherlock-amber" style={{ width: `${(d._count / (data?.totalCases || 1)) * 100}%` }} />
                </div>
                <span className="text-xs font-mono text-sherlock-dim w-6 text-right">{d._count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
