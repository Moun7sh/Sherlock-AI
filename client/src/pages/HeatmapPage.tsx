import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { MapPin, TrendingUp } from "lucide-react";

const PLACES: Record<string, [number, number]> = {
  Mysuru: [34, 66], Mandya: [41, 58], Bengaluru: [55, 52], Mangaluru: [12, 46],
  Hassan: [30, 50], Hubballi: [33, 26], Belagavi: [24, 14], Kalaburagi: [58, 12],
  Shimoga: [38, 38], Davangere: [45, 32], Tumakuru: [48, 46], Raichur: [52, 20],
};

export default function HeatmapPage() {
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<any>("/analytics/dashboard").catch(() => null) });
  const districts = (data?.crimeByDistrict || []).sort((a: any, b: any) => b._count - a._count);
  const maxCount = districts[0]?._count || 1;

  return (
    <div className="p-6">
      <div className="flex items-center gap-2.5 mb-1">
        <MapPin size={19} className="text-sherlock-amber" />
        <h1 className="font-mono text-lg tracking-wide font-bold">Crime Hotspot Map</h1>
      </div>
      <p className="text-xs text-sherlock-mut mb-5 ml-7">District-level crime intensity across Karnataka</p>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
        {/* Map */}
        <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
          <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: "1 / .85", background: "#080C16", border: "1px solid #1A2338" }}>
            <svg viewBox="0 0 100 85" style={{ width: "100%", height: "100%" }}>
              <path d="M18 8 L40 6 L52 10 L64 8 L70 18 L66 30 L72 42 L64 54 L58 60 L48 64 L42 72 L34 78 L26 72 L20 60 L10 52 L8 40 L14 30 L10 20 Z"
                fill="#0A1120" stroke="#1A2338" strokeWidth=".55" />
              {Object.entries(PLACES).map(([name, [x, y]]) => {
                const d = districts.find((dd: any) => dd.district === name);
                const count = d?._count || 0;
                const intensity = count / maxCount;
                const color = intensity > 0.6 ? "#FF4D6D" : intensity > 0.3 ? "#FBBF24" : "#5B8DEF";
                const r = intensity > 0 ? 2 + intensity * 6 : 1.5;
                return (
                  <g key={name}>
                    {intensity > 0 && (
                      <circle cx={x} cy={y * .89} r={r * 2.5} fill={color} opacity={.12}>
                        <animate attributeName="r" values={`${r*2};${r*3.5};${r*2}`} dur="3s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle cx={x} cy={y * .89} r={r} fill={intensity > 0 ? color : "#4C5877"} />
                    <text x={x + 3.5} y={y * .89 + 1.3} fill={intensity > 0 ? "#E8EEF9" : "#4C5877"}
                      style={{ fontSize: "3.2px", fontFamily: "ui-monospace, monospace" }}>{name}</text>
                    {count > 0 && (
                      <text x={x} y={y * .89 - r - 1.5} textAnchor="middle" fill={color}
                        style={{ fontSize: "3px", fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>{count}</text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex gap-4 mt-3">
            {[["High", "#FF4D6D"], ["Moderate", "#FBBF24"], ["Low", "#5B8DEF"]].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1.5 text-[10px] text-sherlock-mut">
                <span className="w-2 h-2 rounded-full" style={{ background: c as string }} />{l}
              </div>
            ))}
          </div>
        </div>

        {/* Rankings */}
        <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
          <span className="font-mono text-[10px] tracking-widest uppercase text-sherlock-steel">Ranked hotspots</span>
          <div className="flex flex-col gap-3 mt-4">
            {districts.slice(0, 8).map((d: any, i: number) => {
              const pct = (d._count / maxCount) * 100;
              const color = pct > 70 ? "#FF4D6D" : pct > 40 ? "#FBBF24" : "#5B8DEF";
              return (
                <div key={d.district}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs">{d.district}</span>
                    <span className="font-mono text-xs" style={{ color }}>{d._count}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#111A2D" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Crime type breakdown */}
          <div className="mt-6">
            <span className="font-mono text-[10px] tracking-widest uppercase text-sherlock-steel">By crime type</span>
            <div className="flex flex-col gap-2 mt-3">
              {(data?.crimeByType || []).map((t: any) => (
                <div key={t.crimeType} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: "#080C16", border: "1px solid #1A2338" }}>
                  <span className="text-xs">{t.crimeType}</span>
                  <span className="font-mono text-xs text-sherlock-amber">{t._count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
