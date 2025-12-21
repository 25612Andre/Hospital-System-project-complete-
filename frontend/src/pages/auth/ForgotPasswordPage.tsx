import React, { useState } from "react";
import { authApi } from "../../api/authApi";
import AppButton from "../../components/common/AppButton";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await authApi.requestPasswordReset(email);
      // In production, backend just says "Sent". In dev, it might return token.
      // User requested NOT to show it in notification or auto-fill.
      // We will log specific token info to console for debugging if needed.
      console.log("Debug Response:", res);

      toast.success("Reset code sent to your email.");
      setStep(2);
    } catch (e) {
      toast.error("Failed to send reset code");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await authApi.resetPassword(email, token, password);
      toast.success("Password reset successfully. Please login.");
      navigate("/login");
    } catch (err: any) {
      const msg = err.response?.data || "Failed to reset password. Invalid token?";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {step === 1 ? "Forgot password?" : "Reset Password"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {step === 1 ? "No worries, we'll send you reset instructions." : "Enter the code sent to your email and a new password."}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl shadow-primary-500/10 ring-1 ring-slate-100">
          {step === 1 ? (
            <form onSubmit={handleRequestToken} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <AppButton type="submit" className="w-full shadow-lg shadow-primary-500/30">
                Send reset link
              </AppButton>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="text-sm bg-blue-50 text-blue-700 p-3 rounded mb-4">
                Check your email for the verification code.
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reset Code</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 placeholder:text-slate-400"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="e.g. 1234"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New strong password"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </div>
              <AppButton type="submit" className="w-full shadow-lg shadow-primary-500/30">
                Reset Password
              </AppButton>
            </form>
          )}

          <div className="mt-6 text-center">
            <a href="/login" className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to log in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
