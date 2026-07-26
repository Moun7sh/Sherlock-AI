import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/auth";
import LoginPage from "./pages/LoginPage";
import ShellLayout from "./components/ShellLayout";

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/*" element={isAuthenticated ? <ShellLayout /> : <Navigate to="/login" />} />
    </Routes>
  );
}
