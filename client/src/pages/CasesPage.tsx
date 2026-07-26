import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { FileText, Search } from "lucide-react";

export default function CasesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["cases", search],
    queryFn: () => api.get<any>(`/cases?search=${search}&limit=50`),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <FileText size={19} className="text-sherlock-steel" />
            <h1 className="font-mono text-lg tracking-wide font-bold">Case Explorer</h1>
          </div>
          <p className="text-xs text-sherlock-mut mt-1 ml-7">Browse, search and manage all FIRs</p>
        </div>
      </div>

      <div className="rounded-xl p-3 mb-4 flex items-center gap-3"
        style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
        <Search size={16} className="text-sherlock-mut" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search FIR number, title, description…"
          className="flex-1 bg-transparent outline-none text-sm text-sherlock-text" />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #1A2338" }}>
              {["FIR", "Title", "Type", "District", "Status", "Date"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-mono text-[10px] tracking-widest text-sherlock-mut uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((c: any) => (
              <tr key={c.id} className="cursor-pointer hover:bg-sherlock-panelHi transition"
                style={{ borderBottom: "1px solid #FFFFFF08" }}
                onClick={() => navigate(`/cases/${c.id}`)}>
                <td className="px-4 py-3 font-mono text-xs text-sherlock-steel">{c.firNumber}</td>
                <td className="px-4 py-3 text-sm">{c.title}</td>
                <td className="px-4 py-3 text-xs text-sherlock-dim">{c.crimeType}</td>
                <td className="px-4 py-3 text-xs text-sherlock-dim">{c.district}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono"
                    style={{ background: "#5B8DEF18", color: "#5B8DEF" }}>{c.status}</span>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-sherlock-mut">
                  {new Date(c.dateOfOffence).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <div className="px-4 py-8 text-center text-sherlock-mut text-sm">Loading cases…</div>}
        {!isLoading && data?.total === 0 && <div className="px-4 py-8 text-center text-sherlock-mut text-sm">No cases found.</div>}
      </div>
      {data?.total > 0 && <div className="mt-3 text-xs text-sherlock-mut text-right">{data.total} total cases</div>}
    </div>
  );
}
