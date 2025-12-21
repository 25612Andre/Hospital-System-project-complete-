import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AppTable from "../../components/common/AppTable";
import SearchInput from "../../components/common/SearchInput";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AppButton from "../../components/common/AppButton";
import { billApi, type Bill } from "../../api/billApi";
import { appointmentApi, type Appointment } from "../../api/appointmentApi";
import type { PagedResult } from "../../api/personApi";
import StatsBar from "../../components/common/StatsBar";
import { useAuth } from "../../context/useAuth";
import BillDetailsModal from "./BillDetailsModal";

const BillListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [term, setTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [paymentBill, setPaymentBill] = useState<Bill | null>(null);

  // Searchable appointment input state
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  const queryClient = useQueryClient();
  const { roles } = useAuth();
  const canManage = roles.includes("ADMIN");

  const { data, isLoading } = useQuery<PagedResult<Bill>>({
    queryKey: ["bills", page, term],
    queryFn: () => billApi.listPage({ page, size, sort: "issuedDate,desc", q: term || undefined }),
  });

  // Search appointments as user types (only unbilled)
  const { data: searchResults, isLoading: searchLoading } = useQuery<PagedResult<Appointment>>({
    queryKey: ["appointments-search", appointmentSearch],
    queryFn: async () => {
      // First get unbilled appointments, then filter by search term if provided
      const unbilled = await appointmentApi.listAll(true);
      const filtered = appointmentSearch.trim()
        ? unbilled.filter((app) => {
          const searchLower = appointmentSearch.toLowerCase();
          return (
            app.patient?.fullName?.toLowerCase().includes(searchLower) ||
            app.doctor?.name?.toLowerCase().includes(searchLower) ||
            String(app.id).includes(appointmentSearch)
          );
        })
        : unbilled;
      return {
        content: filtered.slice(0, 10),
        totalElements: filtered.length,
        totalPages: 1,
        number: 0,
        size: 10,
      };
    },
    enabled: formOpen,
  });

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (data?.content || []).forEach((row) => {
      counts[row.status] = (counts[row.status] || 0) + 1;
    });
    return counts;
  }, [data?.content]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) {
      toast.error("Select an appointment");
      return;
    }
    try {
      await billApi.generate(selectedAppointment.id);
      toast.success("Bill generated");
      setSelectedAppointment(null);
      setAppointmentSearch("");
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-search"] });
    } catch {
      toast.error("Could not generate bill");
    }
  };

  const handleStatus = async (bill: Bill, status: string) => {
    await billApi.update(bill.id, { status });
    toast.success("Status updated");
    queryClient.invalidateQueries({ queryKey: ["bills"] });
  };

  const handlePayment = async (method: string) => {
    if (!paymentBill) return;
    try {
      await billApi.update(paymentBill.id, { status: "Paid", paymentMethod: method });
      toast.success(`Bill marked as Paid via ${method}`);
      setPaymentBill(null);
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleSelectAppointment = (app: Appointment) => {
    setSelectedAppointment(app);
    setAppointmentSearch(`#${app.id} - ${app.patient?.fullName || "Unknown"} with ${app.doctor?.name || "Unknown"}`);
    setShowResults(false);
  };

  // Close results dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowResults(false);
    if (showResults) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showResults]);

  if (isLoading || !data) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Bills</h1>
          <p className="text-sm text-slate-500">Generate invoices from appointments and track payment status.</p>
        </div>
        <div className="flex gap-2">
          <SearchInput
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setPage(0);
            }}
            placeholder="Search by status or patient..."
          />
          <AppButton variant="secondary" onClick={() => { setTerm(""); setPage(0); }}>
            Clear
          </AppButton>
          {canManage && <AppButton onClick={() => setFormOpen(true)}>Generate Bill</AppButton>}
        </div>
      </div>

      {data && (
        <StatsBar
          items={[
            { label: "Total Bills", value: data.totalElements },
            { label: "Paid", value: statusCounts["Paid"] || 0 },
            { label: "Pending", value: statusCounts["Pending"] || 0 },
            { label: "Showing", value: data.content.length },
          ]}
        />
      )}

      {canManage && formOpen && (
        <form
          onSubmit={handleGenerate}
          className="bg-white border rounded-lg shadow-sm p-4 space-y-4"
        >
          <div className="relative">
            <label className="block text-sm mb-1">Search Appointment</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Search by patient name, doctor name, or appointment ID..."
              value={appointmentSearch}
              onChange={(e) => {
                setAppointmentSearch(e.target.value);
                setSelectedAppointment(null);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onClick={(e) => e.stopPropagation()}
            />
            {showResults && searchResults && searchResults.content.length > 0 && (
              <div
                className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {searchLoading ? (
                  <div className="p-3 text-sm text-slate-500">Searching...</div>
                ) : (
                  searchResults.content.map((app) => (
                    <div
                      key={app.id}
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleSelectAppointment(app)}
                    >
                      <div className="font-medium">#{app.id} - {app.patient?.fullName || "Unknown Patient"}</div>
                      <div className="text-sm text-slate-500">
                        with {app.doctor?.name || "Unknown Doctor"} • {app.status} • RWF {app.consultationFee?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {showResults && searchResults && searchResults.content.length === 0 && appointmentSearch && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-3">
                <div className="text-sm text-slate-500">No unbilled appointments found</div>
              </div>
            )}
          </div>

          {selectedAppointment && (
            <div className="bg-slate-50 border rounded p-3">
              <div className="text-sm font-medium">Selected: #{selectedAppointment.id}</div>
              <div className="text-sm text-slate-600">
                Patient: {selectedAppointment.patient?.fullName} | Doctor: {selectedAppointment.doctor?.name}
              </div>
              <div className="text-sm text-slate-600">
                Fee: RWF {selectedAppointment.consultationFee?.toFixed(2) || "0.00"}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <AppButton type="button" variant="secondary" onClick={() => { setFormOpen(false); setSelectedAppointment(null); setAppointmentSearch(""); }}>
              Cancel
            </AppButton>
            <AppButton type="submit" disabled={!selectedAppointment}>Create bill</AppButton>
          </div>
        </form>
      )}

      <AppTable
        columns={[
          { key: "id", header: "ID" },
          {
            key: "amount",
            header: "Amount",
            render: (row: Bill) => <span className="font-semibold text-slate-700">RWF {row.amount.toFixed(2)}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (row: Bill) => {
              const color = row.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
              return (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
                  {row.status}
                </span>
              );
            }
          },
          {
            key: "issuedDate",
            header: "Issued",
            render: (row: Bill) => new Date(row.issuedDate).toLocaleString(),
          },
          {
            key: "appointment",
            header: "Appointment",
            render: (row: Bill) => (
              <div>
                <div className="font-medium text-slate-800">{row.appointment?.patient?.fullName || "Unknown"}</div>
                <div className="text-xs text-slate-500">#{row.appointment?.id} • {row.appointment?.doctor?.name}</div>
              </div>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (row: Bill) => (
              <div className="flex gap-2">
                <AppButton variant="secondary" onClick={() => setViewBill(row)}>
                  View
                </AppButton>
                {canManage && (
                  <>
                    {row.status !== "Paid" && (
                      <AppButton variant="primary" onClick={() => setPaymentBill(row)}>
                        Mark Paid
                      </AppButton>
                    )}
                    {/* Hide Pend button for now as flow is usually one-way */}
                  </>
                )}
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

      {/* Payment Method Modal */}
      {paymentBill && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Select Payment Method</h3>
            <p className="text-sm text-slate-600 mb-6">
              How is this bill being paid?
              <br />
              <span className="font-semibold text-slate-900">Total: RWF {paymentBill.amount.toFixed(2)}</span>
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handlePayment("Mobile Money")}
                className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-lg flex items-center justify-center gap-2 transition"
              >
                📱 Mobile Money
              </button>
              <button
                onClick={() => handlePayment("Card")}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition"
              >
                💳 Card
              </button>
              <button
                onClick={() => handlePayment("CASH")}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition"
              >
                💵 CASH
              </button>
            </div>
            <div className="mt-6 pt-4 border-t flex justify-center">
              <button
                onClick={() => setPaymentBill(null)}
                className="text-slate-500 hover:text-slate-800 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {viewBill && (
        <BillDetailsModal
          bill={viewBill}
          onClose={() => setViewBill(null)}
        />
      )}
    </div>
  );
};

export default BillListPage;
