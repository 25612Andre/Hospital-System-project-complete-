import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "../../api/authApi";
import { departmentApi, type Department } from "../../api/departmentApi";
import AppButton from "../../components/common/AppButton";
import HierarchicalLocationPicker from "../../components/common/HierarchicalLocationPicker";
import { toast } from "react-toastify";
import type { LocationNode } from "../../api/locationApi";

const roles = ["PATIENT", "DOCTOR"];

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirm: "",
    role: "PATIENT",
    fullName: "",
    age: "",
    gender: "Please Select",
    phone: "",
    locationId: null as number | null,
    // Doctor specific
    departmentId: "",
    specialization: "",
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["departments-all"],
    queryFn: departmentApi.listAll,
    enabled: form.role === "DOCTOR",
  });

  const handleLocationChange = (locationId: number | null, _location: LocationNode | null) => {
    setForm({ ...form, locationId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    // Validation
    if (form.role === "PATIENT") {
      if (!form.fullName || !form.age || !form.phone || !form.locationId || form.gender === "Please Select") {
        toast.error("Please fill in all patient registration details.");
        return;
      }
    }
    if (form.role === "DOCTOR") {
      if (!form.fullName || !form.phone || !form.departmentId || !form.locationId) {
        toast.error("Please fill in all doctor registration details.");
        return;
      }
    }

    try {
      await authApi.signup({
        username: form.username,
        password: form.password,
        role: form.role,
        fullName: form.fullName,
        phone: form.phone,
        age: form.role === "PATIENT" ? Number(form.age) : undefined,
        gender: form.role === "PATIENT" ? form.gender : undefined,
        locationId: form.locationId || undefined,
        departmentId: (form.role === "DOCTOR" && form.departmentId) ? Number(form.departmentId) : undefined,
        specialization: (form.role === "DOCTOR") ? form.specialization : undefined,
      });
      toast.success("Account created successfully. Please login.");
      navigate("/login");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Signup failed.";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg space-y-5 border border-slate-100 my-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">Create Account</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Join our medical platform.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email / Username</label>
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            type="email"
            placeholder="user@example.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">I am a...</label>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {roles.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setForm({
                  ...form,
                  role: r,
                })}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${form.role === r ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {form.role === "PATIENT" && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 mb-2">Patient Details</h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option>Please Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+250..."
              />
            </div>

            <div>
              <HierarchicalLocationPicker
                value={form.locationId}
                onChange={handleLocationChange}
                label="Location"
                required
              />
            </div>
          </div>
        )}

        {form.role === "DOCTOR" && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
            <h3 className="text-sm font-semibold text-blue-900 border-b border-blue-200 pb-2 mb-2">Doctor Profile</h3>

            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">Full Name (Dr.)</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Dr. Jane Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">Phone</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+250..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">Department</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <option value="">Select Department...</option>
                {departments?.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">Top Specialization (Optional)</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder="e.g. Pediatric Surgery"
              />
            </div>

            <div>
              <HierarchicalLocationPicker
                value={form.locationId}
                onChange={handleLocationChange}
                label="Location"
                required
              />
            </div>
          </div>
        )}

        <AppButton type="submit" className="w-full py-2.5 text-lg shadow-lg shadow-blue-500/30">
          Sign Up
        </AppButton>

        <div className="text-sm text-center text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline">
            Sign In
          </Link>
        </div>
      </form>
    </div>
  );
};

export default SignupPage;
