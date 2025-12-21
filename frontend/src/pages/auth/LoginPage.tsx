import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import AppButton from "../../components/common/AppButton";
import { toast } from "react-toastify";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await login({ username, password });
      if (result === "2FA") {
        toast.info("2FA required. Check your email or authenticator.");
        return navigate("/2fa");
      }
      navigate("/");
    } catch (err) {
      setError("Login failed. Check your credentials and try again.");
      toast.error("Login failed. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-200">Your life, our priority</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-white">Hospital Management System</h1>
            <p className="text-lg text-slate-200 max-w-2xl">
              A service designed for every patient, offering warm support, reliable care, and a healthcare experience that
              inspires confidence at every step.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { label: "Uptime", value: "99.9%" },
                { label: "Response SLA", value: "< 200ms" },
                { label: "Users", value: "1,200+" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-sm text-slate-300">{stat.label}</div>
                  <div className="text-2xl font-semibold text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-8 shadow-2xl shadow-primary-500/10 ring-1 ring-slate-100">
              <div className="mb-6 space-y-2">
                <p className="text-sm font-semibold text-primary-600">Welcome back</p>
                <h2 className="text-2xl font-bold text-slate-900">Sign in to continue</h2>
                <p className="text-sm text-slate-500">Use your organizational account to access the admin workspace.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Username</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="you@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <Link to="/forgot-password" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                      Forgot?
                    </Link>
                  </div>
                  <input
                    type="password"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}

                <AppButton type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Signing in..." : "Sign in"}
                </AppButton>
              </form>

              <div className="mt-6 text-center text-sm text-slate-600">
                Don&apos;t have access?{" "}
                <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
                  Request an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
