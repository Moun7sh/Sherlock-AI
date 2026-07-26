import { lazy, Suspense } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Activity, Search, GitBranch, Upload, Users, Crosshair, Lock,
  Fingerprint, Bell, LogOut, Clock, MapPin, Microscope, Brain } from "lucide-react";
import { useAuthStore } from "../stores/auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

// Existing pages (unchanged)
const Dashboard = lazy(() => import("../pages/DashboardPage"));
const CasesPage = lazy(() => import("../pages/CasesPage"));
const CaseDetail = lazy(() => import("../pages/CaseDetailPage"));
const SearchPage = lazy(() => import("../pages/SearchPage"));
const GraphPage = lazy(() => import("../pages/GraphPage"));
const AgentsPage = lazy(() => import("../pages/AgentsPage"));
const AnalyticsPage = lazy(() => import("../pages/AnalyticsPage"));
// New pages (additive)
const TimelinePage = lazy(() => import("../pages/TimelinePage"));
const HeatmapPage = lazy(() => import("../pages/HeatmapPage"));
const EvidencePage = lazy(() => import("../pages/EvidencePage"));
const AIMonitorPage = lazy(() => import("../pages/AIMonitorPage"));

const NAV = [
  { path: "/", label: "Command Center", icon: Activity },
  { path: "/cases", label: "Cases", icon: Upload },
  { path: "/search", label: "AI Search", icon: Search },
  { path: "/graph", label: "Knowledge Graph", icon: GitBranch },
  { path: "/timeline", label: "Timeline", icon: Clock },
  { path: "/heatmap", label: "Crime Heatmap", icon: MapPin },
  { path: "/evidence", label: "Evidence Explorer", icon: Microscope },
  { path: "/agents", label: "Multi-Agent", icon: Users },
  { path: "/monitor", label: "AI Monitor", icon: Brain },
  { path: "/analytics", label: "Analytics", icon: Crosshair },
];

function Loader() {
  return <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-sherlock-steel border-t-transparent" />
  </div>;
}

export default function ShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: notifs } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<{ unread: number }>("/notifications").catch(() => ({ unread: 0 })),
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen" style={{ background: "#05070E" }}>
      {/* Classification bar */}
      <div className="flex items-center justify-center gap-2 py-1"
        style={{ background: "repeating-linear-gradient(45deg,#1A1206,#1A1206 12px,#17100522 12px,#17100522 24px)",
          borderBottom: "1px solid #1A2338" }}>
        <Lock size={11} className="text-sherlock-amber" />
        <span className="font-mono text-[9.5px] tracking-[.3em] text-sherlock-amber">
          CONFIDENTIAL // KARNATAKA STATE POLICE // FOR OFFICIAL USE ONLY
        </span>
      </div>

      <div className="flex" style={{ minHeight: "calc(100vh - 26px)" }}>
        {/* Sidebar */}
        <aside className="w-[244px] sticky top-0 self-start p-3 flex flex-col"
          style={{ height: "calc(100vh - 26px)", background: "#080C16", borderRight: "1px solid #1A2338", overflowY: "auto" }}>
          <div className="flex items-center gap-2.5 px-2 mb-6">
            <div className="flex items-center justify-center rounded-lg w-9 h-9"
              style={{ background: "#111A2D", border: "1px solid #27334F" }}>
              <Fingerprint size={20} className="text-sherlock-ice" />
            </div>
            <div>
              <div className="font-mono font-bold tracking-[.14em] text-sm">
                SHERLOCK<span className="text-sherlock-steel"> AI</span>
              </div>
              <div className="text-[9px] text-sherlock-mut tracking-wider">INVESTIGATION OS</div>
            </div>
          </div>

          <nav className="flex-1 flex flex-col gap-0.5">
            {NAV.map((n) => {
              const active = n.path === "/" ? location.pathname === "/" : location.pathname.startsWith(n.path);
              return (
                <button key={n.path} onClick={() => navigate(n.path)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                  style={{
                    background: active ? "#111A2D" : "transparent",
                    border: `1px solid ${active ? "#27334F" : "transparent"}`,
                    color: active ? "#E8EEF9" : "#6B7A98",
                  }}>
                  <n.icon size={15} color={active ? "#5B8DEF" : "#6B7A98"} />
                  <span className="text-[12.5px]" style={{ fontWeight: active ? 600 : 500 }}>{n.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-2">
            <button onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sherlock-mut text-xs hover:bg-sherlock-panel">
              <LogOut size={14} /> Sign out
            </button>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
              style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
              <div className="flex items-center justify-center rounded-full w-8 h-8 text-white font-mono text-xs font-bold"
                style={{ background: "#3B6FD6" }}>
                {user?.name?.split(" ").map(w => w[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-sherlock-text truncate">{user?.name}</div>
                <div className="text-[10.5px] text-sherlock-mut">{user?.badgeNumber} · {user?.department}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-x-hidden">
          <div className="flex items-center justify-between px-6 py-3"
            style={{ borderBottom: "1px solid #1A2338", background: "#080C16" }}>
            <div className="flex items-center gap-2 text-sherlock-mut text-xs font-mono">
              <span className="w-[7px] h-[7px] rounded-full bg-sherlock-green animate-pulse-glow" />
              datastore online · agents active · discovery loop running
            </div>
            <div className="flex items-center gap-3">
              <button className="relative" onClick={() => navigate("/")}>
                <Bell size={18} className="text-sherlock-mut" />
                {(notifs?.unread || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sherlock-red text-[9px] text-white flex items-center justify-center font-bold">
                    {notifs?.unread}
                  </span>
                )}
              </button>
            </div>
          </div>

          <Suspense fallback={<Loader />}>
            <Routes>
              {/* Existing routes (unchanged) */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/cases" element={<CasesPage />} />
              <Route path="/cases/:id" element={<CaseDetail />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              {/* New routes (additive) */}
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/heatmap" element={<HeatmapPage />} />
              <Route path="/evidence" element={<EvidencePage />} />
              <Route path="/monitor" element={<AIMonitorPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
