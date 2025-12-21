import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import { useAuth } from "../../context/useAuth";
import { toast } from "react-toastify";

const TwoFactorPage: React.FC = () => {
  const { verify2fa, logout, user, send2fa } = useAuth();
  const [code, setCode] = useState("");
  const pendingUser = useMemo(() => {
    if (user?.username) return user.username;
    const stored = localStorage.getItem("pending_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.username || "";
    }
    return "";
  }, [user?.username]);
  const demoCode = useMemo(() => localStorage.getItem("pending_2fa_code") || "", []);
  const navigate = useNavigate();

  useEffect(() => {
    if (demoCode) {
      toast.info(`Emailed Code: ${demoCode} (Dev Simulation)`, { autoClose: 15000 });
    }
    // Clear code on unmount so it doesn't persist forever
    return () => {
      localStorage.removeItem("pending_2fa_code");
    };
  }, [demoCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verify2fa(code.trim());
      toast.success("2FA verified");
      navigate("/");
    } catch {
      toast.error("Invalid code");
    }
  };

  const handleResend = async () => {
    try {
      await send2fa(pendingUser);
      toast.success("New code sent");
    } catch {
      toast.error("Could not resend code");
    }
  };

  if (!pendingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="bg-white rounded-lg shadow-lg p-8 w-96 space-y-4 border border-slate-100 text-center">
          <p className="text-sm text-slate-700">No pending 2FA session. Please login again.</p>
          <AppButton onClick={() => { logout(); navigate("/login"); }}>Back to login</AppButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 w-96 space-y-4 border border-slate-100">
        <h1 className="text-2xl font-semibold text-slate-800">Two-Factor Authentication</h1>
        <p className="text-sm text-slate-600">Enter the code sent to your email to complete sign-in.</p>

        <div>
          <label className="block text-sm mb-1">6-digit code</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
          />
        </div>
        <div className="flex gap-3">
          <AppButton type="submit" className="flex-1">
            Verify
          </AppButton>
          <AppButton type="button" variant="secondary" onClick={handleResend}>
            Resend
          </AppButton>
        </div>
        <div className="text-center pt-2">
          <button type="button" onClick={() => { logout(); navigate("/login"); }} className="text-sm text-slate-500 hover:text-slate-800 underline">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TwoFactorPage;
