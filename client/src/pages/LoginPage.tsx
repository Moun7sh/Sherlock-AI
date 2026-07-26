import { FormEvent, useState } from "react";
import { Shield, Lock, Fingerprint } from "lucide-react";
import { useAuthStore } from "../stores/auth";
import { api } from "../lib/api";

export default function LoginPage() {
  const [badge, setBadge] = useState("KSP-4471");
  const [password, setPassword] = useState("sherlock2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await api.post<{ accessToken: string; user: any }>("/auth/login", {
        badgeNumber: badge, password,
      });
      login(res.accessToken, res.user);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#05070E" }}>
      <div className="absolute inset-0" style={{
        background: "radial-gradient(1100px 500px at 20% -10%, #3B6FD622, transparent), radial-gradient(900px 500px at 100% 120%, #22D3EE14, transparent)" }} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-sm rounded-xl p-8"
        style={{ background: "#0C1220", border: "1px solid #1A2338" }}>
        <div className="flex items-center gap-3 mb-7">
          <div className="flex items-center justify-center rounded-xl w-11 h-11"
            style={{ background: "#111A2D", border: "1px solid #27334F" }}>
            <Fingerprint size={23} className="text-sherlock-ice" />
          </div>
          <div>
            <div className="font-mono font-bold tracking-widest text-sherlock-text">SHERLOCK AI</div>
            <div className="text-xs text-sherlock-mut">Secure Officer Access</div>
          </div>
        </div>

        <label className="block font-mono text-[10px] tracking-widest text-sherlock-steel uppercase mb-1">Officer ID</label>
        <input value={badge} onChange={(e) => setBadge(e.target.value)}
          className="w-full mb-4 px-3 py-2.5 rounded-lg bg-sherlock-bg2 border border-sherlock-line text-sherlock-text font-mono text-sm outline-none focus:border-sherlock-steel" />

        <label className="block font-mono text-[10px] tracking-widest text-sherlock-steel uppercase mb-1">Passphrase</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-3 py-2.5 rounded-lg bg-sherlock-bg2 border border-sherlock-line text-sherlock-text font-mono text-sm outline-none focus:border-sherlock-steel" />

        {error && <div className="mb-4 text-sm text-sherlock-red">{error}</div>}

        <button type="submit" disabled={loading}
          className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-white font-semibold text-sm disabled:opacity-50"
          style={{ background: "linear-gradient(90deg, #3B6FD6, #5B8DEF)" }}>
          <Shield size={16} /> {loading ? "Authenticating…" : "Authenticate"}
        </button>

        <div className="flex items-center gap-2 mt-5 text-[10px] text-sherlock-mut font-mono">
          <Lock size={11} className="text-sherlock-green" /> AES-256 · JWT session · audit-logged
        </div>
      </form>
    </div>
  );
}
