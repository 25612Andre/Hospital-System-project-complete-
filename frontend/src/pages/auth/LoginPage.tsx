import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/useAuth";
import AppButton from "../../components/common/AppButton";
import { toast } from "react-toastify";
import LanguageSelect from "../../components/common/LanguageSelect";
import { useI18n } from "../../i18n/I18nProvider";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await login({ username: username.trim(), password });
      if (result === "2FA") {
        toast.info(t("auth.twoFaRequired"));
        return navigate("/2fa");
      }
      navigate("/");
    } catch (error) {
      const backendMessage = axios.isAxiosError(error)
        ? typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.message
        : undefined;
      const message = backendMessage || t("auth.loginFailed");
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6 flex justify-end">
          <LanguageSelect className="text-slate-200" />
        </div>
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-200">{t("auth.heroTagline")}</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-white">{t("footer.appName")}</h1>
            <p className="text-lg text-slate-200 max-w-2xl">
              {t("auth.heroDescription")}
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { label: t("auth.stats.uptime"), value: "99.9%" },
                { label: t("auth.stats.responseSla"), value: "< 200ms" },
                { label: t("auth.stats.users"), value: "1,200+" },
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
                <p className="text-sm font-semibold text-primary-600">{t("auth.welcomeBack")}</p>
                <h2 className="text-2xl font-bold text-slate-900">{t("auth.signInToContinue")}</h2>
                <p className="text-sm text-slate-500">{t("auth.formDescription")}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">{t("auth.username")}</label>
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
                    <label className="block text-sm font-medium text-slate-700">{t("auth.password")}</label>
                    <Link to="/forgot-password" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                      {t("auth.forgot")}
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
                  {submitting ? t("auth.signingIn") : t("auth.signIn")}
                </AppButton>
              </form>

              <div className="mt-6 text-center text-sm text-slate-600">
                {t("auth.noAccess")}{" "}
                <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
                  {t("auth.requestAccount")}
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
