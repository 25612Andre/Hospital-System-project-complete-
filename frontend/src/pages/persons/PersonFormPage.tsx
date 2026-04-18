import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import HierarchicalLocationPicker from "../../components/common/HierarchicalLocationPicker";
import { personApi } from "../../api/personApi";
import type { Person } from "../../api/personApi";
import type { LocationNode } from "../../api/locationApi";
import { toast } from "react-toastify";

type FieldKey = "fullName" | "age" | "gender" | "email" | "phone";

type FieldConfig = {
  key: FieldKey;
  label: string;
  type?: "number";
};

const fieldConfigs: FieldConfig[] = [
  { key: "fullName", label: "Full Name" },
  { key: "age", label: "Age", type: "number" },
  { key: "gender", label: "Gender" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
];

const PersonFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [form, setForm] = useState<Person>({
    fullName: "",
    age: 0,
    gender: "MALE",
    email: "",
    phone: "",
    location: undefined,
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    personApi.getById(Number(id)).then((data) => {
      setForm(data);
      setLocationName(data.location?.name ?? "");
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleLocationChange = (name: string) => {
    setLocationName(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      ...form,
      locationName: locationName.trim(),
    };
    try {
      if (isEdit && id) {
        await personApi.update(Number(id), payload);
        toast.success("Patient updated");
      } else {
        await personApi.create(payload);
        toast.success("Patient created");
      }
      navigate("/patients");
    } catch {
      toast.error("Unable to save patient");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">{isEdit ? "Edit" : "New"} Patient</h1>
      <form className="bg-white p-6 rounded-lg shadow-sm border space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fieldConfigs.map((field) => {
            const fieldValue = form[field.key];
            const valueStr = fieldValue === undefined ? "" : String(fieldValue);
            return (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-1 text-slate-700">{field.label}</label>
                {field.key === "gender" ? (
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
                    value={valueStr}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    required
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                ) : (
                  <input
                    type={field.type || "text"}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    value={valueStr}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value,
                      })
                    }
                    required
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-1 text-slate-700">Location</label>
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none"
            placeholder="Enter city, district, or hospital area..."
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <AppButton type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </AppButton>
          <AppButton type="submit">{isEdit ? "Update" : "Create"}</AppButton>
        </div>
      </form>
    </div>
  );
};

export default PersonFormPage;
