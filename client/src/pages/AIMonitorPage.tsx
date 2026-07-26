import { useState, useEffect, useRef } from "react";
import { Brain, Radar, Car, Phone, Landmark, Radio, Waypoints, Target, Microscope, Siren } from "lucide-react";

const DISCOVERIES = [
  { type: "vehicle_reuse", title: "Vehicle reused across districts", detail: "KA-09-MH-1234 in Mysuru, Mandya and Hassan", icon: Car, color: "#FBBF24" },
  { type: "shared_phone", title: "Shared mobile handset", detail: "+91 98450 71xxx attributed to two accused", icon: Phone, color: "#22D3EE" },
  { type: "tower_location", title: "Repeated tower location", detail: "Cell site MYS-0412 on both crime nights", icon: Radio, color: "#5B8DEF" },
  { type: "bank_withdrawal", title: "Shared bank withdrawal", detail: "Same ATM, ₹40,000, minutes before offence", icon: Landmark, color: "#34D399" },
  { type: "escape_route", title: "Same escape route", detail: "Bannur Road used in two robberies", icon: Waypoints, color: "#A78BFA" },
  { type: "crime_pattern", title: "Similar crime pattern", detail: "Closing-time robbery, 3 offenders, sharp weapon", icon: Target, color: "#FB7185" },
  { type: "aliases", title: "Multiple aliases detected", detail: "'Manju' and 'M. Gowda' resolve to one person", icon: Siren, color: "#FF4D6D" },
  { type: "forensic", title: "Forensic match", detail: "Gold assay from Mangaluru matches Mysuru robbery", icon: Microscope, color: "#FBBF24" },
];

export default function AIMonitorPage() {
  const [feed, setFeed] = useState(DISCOVERIES.slice(0, 2));
  const idx = useRef(2);

  useEffect(() => {
    const iv = setInterval(() => {
      const d = DISCOVERIES[idx.current % DISCOVERIES.length];
      setFeed(f => [{ ...d, ts: Date.now() } as any, ...f].slice(0, 12));
      idx.current++;
    }, 4500);
    return () => clearInterval(iv);
  }, []);

  // Also try WebSocket
  useEffect(() => {
    try {
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${proto}://${window.location.host}/ws`);
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "discovery" && msg.data) {
            const match = DISCOVERIES.find(d => d.type === msg.data.type);
            if (match) {
              setFeed(f => [{ ...match, detail: msg.data.detail || match.detail, ts: Date.now() } as any, ...f].slice(0, 12));
            }
          }
        } catch {}
      };
      return () => ws.close();
    } catch {}
  }, []);

  const AGENTS = [
    { id: "investigation", name: "Investigation AI", color: "#5B8DEF" },
    { id: "financial", name: "Financial Crime AI", color: "#34D399" },
    { id: "forensic", name: "Forensic AI", color: "#A78BFA" },
    { id: "cyber", name: "Cyber & CDR AI", color: "#22D3EE" },
    { id: "behavioral", name: "Behaviour AI", color: "#FB7185" },
    { id: "legal", name: "Legal AI", color: "#FBBF24" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-2.5 mb-1">
        <Brain size={19} className="text-sherlock-cyan" />
        <h1 className="font-mono text-lg tracking-wide font-bold">AI Investigation Monitor</h1>
      </div>
      <p className="text-xs text-sherlock-mut mb-5 ml-7">Autonomous discovery feed and agent status — updates in real time</p>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 320px" }}>
        {/* Live feed */}
        <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radar size={15} className="text-sherlock-cyan" style={{ animation: "spin 4s linear infinite" }} />
              <span className="font-mono text-[10px] tracking-widest uppercase text-sherlock-cyan">Autonomous discovery feed</span>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-sherlock-green">
              <span className="w-1.5 h-1.5 rounded-full bg-sherlock-green animate-pulse-glow" />LIVE
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {feed.map((f: any, i: number) => (
              <div key={`${f.type}-${f.ts || i}`}
                className="flex items-start gap-3 p-3 rounded-lg transition-all"
                style={{
                  background: i === 0 ? `${f.color}0C` : "#080C16",
                  border: `1px solid ${i === 0 ? `${f.color}44` : "#1A2338"}`,
                  opacity: 1 - i * 0.06,
                  animation: i === 0 ? "rise-in .5s ease" : undefined,
                }}>
                <div className="rounded-md flex items-center justify-center w-8 h-8 shrink-0"
                  style={{ background: "#111A2D", border: `1px solid ${f.color}44` }}>
                  <f.icon size={15} color={f.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{f.title}</div>
                  <div className="text-xs text-sherlock-dim mt-0.5">{f.detail}</div>
                </div>
                <span className="text-[9px] font-mono text-sherlock-mut shrink-0">
                  {f.ts ? `${Math.round((Date.now() - f.ts) / 1000)}s ago` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent status + confidence */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
            <span className="font-mono text-[10px] tracking-widest uppercase text-sherlock-steel">Agent status</span>
            <div className="flex flex-col gap-2 mt-3">
              {AGENTS.map(a => (
                <div key={a.id} className="flex items-center gap-2.5 p-2 rounded-lg"
                  style={{ background: "#080C16", border: "1px solid #1A2338" }}>
                  <div className="rounded-md flex items-center justify-center w-7 h-7"
                    style={{ background: "#111A2D", border: `1px solid ${a.color}44` }}>
                    <Brain size={13} color={a.color} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs">{a.name}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sherlock-green animate-pulse-glow" />
                    <span className="text-[10px] font-mono text-sherlock-green">active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
            <span className="font-mono text-[10px] tracking-widest uppercase text-sherlock-red">Network alert</span>
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-sherlock-dim">Overall confidence</span>
                <span className="font-mono text-lg font-bold text-sherlock-red">96%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mt-2" style={{ background: "#111A2D" }}>
                <div className="h-full rounded-full" style={{ width: "96%", background: "linear-gradient(90deg, #FF4D6D, #FB7185)" }} />
              </div>
              <div className="text-[10px] text-sherlock-mut mt-3 leading-relaxed">
                Five independent evidence classes converge on the same three accused across three districts.
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
            <span className="font-mono text-[10px] tracking-widest uppercase text-sherlock-steel">System health</span>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {[["Datastore", "online"], ["WebSocket", "active"], ["Agent pipeline", "ready"], ["Discovery loop", "running"]].map(([k, v]) => (
                <div key={k} className="px-2 py-1.5 rounded-lg text-center" style={{ background: "#080C16", border: "1px solid #1A2338" }}>
                  <div className="text-[10px] text-sherlock-green font-mono">{v}</div>
                  <div className="text-[9px] text-sherlock-mut mt-0.5">{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
