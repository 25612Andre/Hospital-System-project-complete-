import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AppTable from "../../components/common/AppTable";
import SearchInput from "../../components/common/SearchInput";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AppButton from "../../components/common/AppButton";
import { departmentApi, type Department } from "../../api/departmentApi";
import type { PagedResult } from "../../api/personApi";

const emptyForm: Department = {
  name: "",
  consultationFee: 0,
};

const DepartmentListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [term, setTerm] = useState("");
  const [form, setForm] = useState<Department>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PagedResult<Department>>({
    queryKey: ["departments", page, term],
    queryFn: async () => {
      if (term) {
        const all = await departmentApi.listAll();
        const filtered = all.filter((d) => JSON.stringify(d).toLowerCase().includes(term.toLowerCase()));
        return {
          content: filtered,
          totalElements: filtered.length,
          number: 0,
          size: filtered.length || size,
        } as PagedResult<Department>;
      }
      return departmentApi.listPage({ page, size, sort: "id,asc" });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    try {
      if (editingId) {
        await departmentApi.update(editingId, form);
        toast.success("Department updated");
      } else {
        await departmentApi.create(form);
        toast.success("Department created");
      }
      setForm(emptyForm);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    } catch {
      toast.error("Unable to save department");
    }
  };

  const handleEdit = (row: Department) => {
    setForm({ name: row.name, consultationFee: row.consultationFee });
    setEditingId(row.id ?? null);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm("Delete this department?")) return;
    await departmentApi.remove(id);
    toast.success("Department removed");
    queryClient.invalidateQueries({ queryKey: ["departments"] });
  };

  if (isLoading || !data) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Departments</h1>
          <p className="text-sm text-slate-500">Consultation fees and specialties.</p>
        </div>
        <div className="flex gap-2">
          <SearchInput
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setPage(0);
            }}
            placeholder="Search..."
          />
          <AppButton variant="secondary" onClick={() => setTerm("")}>
            Clear
          </AppButton>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-lg shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Consultation Fee</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={form.consultationFee}
            onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })}
            min="0"
            step="0.01"
            required
          />
        </div>
        <div className="md:col-span-3 flex justify-end gap-2">
          {editingId && (
            <AppButton type="button" variant="secondary" onClick={() => { setForm(emptyForm); setEditingId(null); }}>
              Cancel
            </AppButton>
          )}
          <AppButton type="submit">{editingId ? "Update" : "Create"}</AppButton>
        </div>
      </form>

      <AppTable
        columns={[
          { key: "id", header: "ID" },
          { key: "name", header: "Name" },
          { key: "consultationFee", header: "Consultation Fee" },
          {
            key: "actions",
            header: "Actions",
            render: (row: Department) => (
              <div className="flex gap-2">
                <AppButton variant="secondary" onClick={() => handleEdit(row)}>
                  Edit
                </AppButton>
                <AppButton variant="ghost" onClick={() => handleDelete(row.id)}>
                  Delete
                </AppButton>
              </div>
            ),
          },
        ]}
        data={data.content}
        total={data.totalElements}
        page={data.number}
        size={size}
        onPageChange={setPage}
      />
    </div>
  );
};

export default DepartmentListPage;
