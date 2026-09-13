import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, EyeClosed } from "@solar-icons/react";
import { useAuthToken } from "@/hooks/useAdminRooms";
import { isApiConfigured } from "@/lib/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const authMut = useAuthToken();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // Mock mode: no backend, skip login
  if (!isApiConfigured()) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl border text-center">
        <p className="text-sm text-slate-500">API not configured. Admin uses mock data and requires no login.</p>
        <Button className="mt-4" onClick={() => navigate({ to: "/admin/venues" })}>Go to Venues</Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authMut.mutateAsync(form);
      localStorage.setItem("availlo_user", form.username);
      navigate({ to: "/admin/venues" });
    } catch {
      // error shown via isError
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <Link to="/" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors mb-2 inline-block">
            ← Back to home
          </Link>
          <CardTitle className="text-2xl font-black">Admin Login</CardTitle>
          <CardDescription>Sign in with staff credentials to manage venues and timetables.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Username</Label>
              <Input
                placeholder="admin"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {authMut.isError && (
              <p className="text-sm text-red-500">Invalid credentials. Check username/password.</p>
            )}
            <Button type="submit" className="w-full font-bold" disabled={authMut.isPending}>
              {authMut.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
