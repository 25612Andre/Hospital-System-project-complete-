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
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Person>({
    fullName: "",
    age: 0,
    gender: "M",
    email: "",
    phone: "",
    location: undefined,
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    personApi.getById(Number(id)).then((data) => {
      setForm(data);
      setSelectedLocationId(data.location?.id ?? null);
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleLocationChange = (locationId: number | null, _location: LocationNode | null) => {
    setSelectedLocationId(locationId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocationId) {
      toast.error("Please select a location (at least a province)");
      return;
    }
    const payload: Person = {
      ...form,
      location: { id: selectedLocationId },
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
              </div>
            );
          })}
        </div>

        <div className="border-t pt-4">
          <HierarchicalLocationPicker
            value={selectedLocationId}
            onChange={handleLocationChange}
            label="Location"
            required
          />
          <p className="text-xs text-slate-500 mt-2">
            Select the patient's location following the hierarchy: Province → District → Sector → Cell → Village
          </p>
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
