import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { Search, FileText, User, Car, Zap } from "lucide-react";

export default function SearchPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["search", submitted],
    queryFn: () => submitted ? api.get<any>(`/search?q=${encodeURIComponent(submitted)}`) : null,
    enabled: !!submitted,
  });

  return (
    <div className="p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <Search size={19} className="text-sherlock-cyan" />
        <h1 className="font-mono text-lg tracking-wide font-bold">AI Search</h1>
      </div>
      <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
        <Search size={16} className="text-sherlock-cyan" />
        <input value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setSubmitted(q)}
          placeholder="Search cases, suspects, vehicles…" className="flex-1 bg-transparent outline-none text-sm text-sherlock-text" />
        <button onClick={() => setSubmitted(q)} className="px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold"
          style={{ background: "#22D3EE", color: "#05070E" }}>
          <Zap size={14} /> Search
        </button>
      </div>

      {isLoading && <div className="mt-6 text-sherlock-mut text-sm">Searching…</div>}

      {data && (
        <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
            <span className="font-mono text-[10px] tracking-widest text-sherlock-steel uppercase">Cases ({data.cases.length})</span>
            <div className="flex flex-col gap-1.5 mt-2">
              {data.cases.map((c: any) => (
                <button key={c.id} onClick={() => navigate(`/cases/${c.id}`)}
                  className="text-left px-2.5 py-2 rounded-lg bg-sherlock-bg2 border border-sherlock-line hover:border-sherlock-steel transition">
                  <div className="flex items-center gap-2 text-xs"><FileText size={12} className="text-sherlock-steel" />{c.firNumber}</div>
                  <div className="text-sm mt-0.5">{c.title}</div>
                </button>
              ))}
              {!data.cases.length && <div className="text-xs text-sherlock-mut">No matching cases</div>}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
            <span className="font-mono text-[10px] tracking-widest text-sherlock-steel uppercase">Persons ({data.persons.length})</span>
            <div className="flex flex-col gap-1.5 mt-2">
              {data.persons.map((p: any) => (
                <div key={p.id} className="px-2.5 py-2 rounded-lg bg-sherlock-bg2 border border-sherlock-line">
                  <div className="flex items-center gap-2 text-xs"><User size={12} className="text-sherlock-red" />{p.name}</div>
                  {p.alias && <div className="text-[10px] text-sherlock-mut">alias "{p.alias}"</div>}
                </div>
              ))}
              {!data.persons.length && <div className="text-xs text-sherlock-mut">No matching persons</div>}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
            <span className="font-mono text-[10px] tracking-widest text-sherlock-steel uppercase">Vehicles ({data.vehicles.length})</span>
            <div className="flex flex-col gap-1.5 mt-2">
              {data.vehicles.map((v: any) => (
                <div key={v.id} className="px-2.5 py-2 rounded-lg bg-sherlock-bg2 border border-sherlock-line">
                  <div className="flex items-center gap-2 text-xs"><Car size={12} className="text-sherlock-amber" />{v.registration}</div>
                  <div className="text-[10px] text-sherlock-mut">{v.color} {v.make}</div>
                </div>
              ))}
              {!data.vehicles.length && <div className="text-xs text-sherlock-mut">No matching vehicles</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
