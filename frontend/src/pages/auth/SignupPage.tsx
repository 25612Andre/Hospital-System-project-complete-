import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api/authApi";
import AppButton from "../../components/common/AppButton";
import HierarchicalLocationPicker from "../../components/common/HierarchicalLocationPicker";
import { toast } from "react-toastify";
import type { LocationNode } from "../../api/locationApi";
import LanguageSelect from "../../components/common/LanguageSelect";
import { useI18n } from "../../i18n/I18nProvider";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirm: "",
    role: "PATIENT",
    fullName: "",
    age: "",
    gender: "",
    phone: "",
    locationId: null as number | null,
    locationName: "",
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>("");

  const handleLocationChange = (locationId: number | null, _location: LocationNode | null) => {
    setForm({ ...form, locationId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error(t("signup.validation.passwordMismatch"));
      return;
    }

    // Validation
    if (!form.fullName || !form.age || !form.phone || !form.gender) {
      toast.error(t("signup.validation.patientDetails"));
      return;
    }

    try {
      await authApi.signup({
        username: form.username,
        password: form.password,
        role: "PATIENT",
        fullName: form.fullName,
        phone: form.phone,
        age: Number(form.age),
        gender: form.gender,
        locationId: form.locationId || undefined,
        locationName: form.locationName || undefined,
      }, profilePicture || undefined);
      toast.success(t("signup.success"));
      navigate("/login");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Signup failed.";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8 relative">
      <div className="absolute right-4 top-4">
        <LanguageSelect />
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg space-y-5 border border-slate-100 my-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">{t("signup.createAccount")}</h1>
          <p className="text-slate-500 mt-2 text-sm">
            {t("signup.joinPlatform")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t("signup.emailUsername")}</label>
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            type="email"
            placeholder="user@example.com"
          />
        </div>

        {/* Profile Picture Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">{t("signup.profilePictureOptional")}</label>
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center overflow-hidden">
              {profilePreview ? (
                <img src={profilePreview} alt="Profile preview" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-10 h-10 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>
            {/* Upload Button */}
            <div className="flex-1">
              <input
                type="file"
                id="profile-picture"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setProfilePicture(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setProfilePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <label
                htmlFor="profile-picture"
                className="inline-block cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {t("common.choosePhoto")}
              </label>
              {profilePicture && (
                <button
                  type="button"
                  onClick={() => {
                    setProfilePicture(null);
                    setProfilePreview("");
                  }}
                  className="ml-2 text-sm text-red-600 hover:text-red-700"
                >
                  {t("common.remove")}
                </button>
              )}
              <p className="text-xs text-slate-500 mt-1">JPG, PNG, GIF, or WEBP (max 5MB)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("common.password")}</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("signup.confirm")}</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 mb-2">{t("signup.patientDetails")}</h3>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t("signup.fullName")}</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t("signup.age")}</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t("signup.gender")}</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                required
              >
                <option value="">{t("signup.gender.select")}</option>
                <option value="MALE">{t("signup.gender.male")}</option>
                <option value="FEMALE">{t("signup.gender.female")}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t("signup.phone")}</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+250..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t("common.location")} ({t("common.optional") || "Optional"})</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.locationName || ""}
              onChange={(e) => setForm({ ...form, locationName: e.target.value })}
              placeholder="Enter your city or area..."
            />
          </div>
        </div>

        <AppButton type="submit" className="w-full py-2.5 text-lg shadow-lg shadow-blue-500/30">
          {t("signup.signUp")}
        </AppButton>

        <div className="text-sm text-center text-slate-500">
          {t("signup.haveAccount")}{" "}
          <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline">
            {t("signup.signIn")}
          </Link>
        </div>
      </form>
    </div>
  );
};

export default SignupPage;
