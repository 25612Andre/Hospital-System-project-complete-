import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { authApi } from "../../api/authApi";
import AppButton from "../../components/common/AppButton";
import { toast } from "react-toastify";

const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await authApi.resetPassword(email, token, password);
    toast.success("Password reset");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 w-96 space-y-4 border border-slate-100">
        <h1 className="text-2xl font-semibold text-slate-800">Reset Password</h1>
        <div>
          <label className="block text-sm mb-1">New password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <AppButton type="submit" className="w-full">
          Update password
        </AppButton>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
