import React from "react";
import AppButton from "../../components/common/AppButton";
import type { Bill } from "../../api/billApi";

interface BillDetailsModalProps {
    bill: Bill;
    onClose: () => void;
}

const BillDetailsModal: React.FC<BillDetailsModalProps> = ({ bill, onClose }) => {
    const patient = bill.appointment?.patient;
    const doctor = bill.appointment?.doctor;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Modal Header (Actions) */}
                <div className="flex justify-between items-center p-4 bg-slate-100 border-b print:hidden">
                    <h2 className="text-lg font-semibold text-slate-700">Invoice Details</h2>
                    <div className="flex gap-2">
                        <AppButton variant="secondary" onClick={() => window.print()}>
                            Print Invoice
                        </AppButton>
                        <AppButton variant="primary" onClick={onClose}>
                            Close
                        </AppButton>
                    </div>
                </div>

                {/* Watermark Background */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] z-0 overflow-hidden">
                    <svg width="600" height="600" viewBox="0 0 24 24" fill="currentColor" className="text-slate-900 transform -rotate-12">
                        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3ZM10 17H8V13H6V11H8V7H10V11H14V7H16V11H18V13H16V17H14V13H10V17Z" />
                    </svg>
                </div>

                {/* Invoice Content (Printable Area) */}
                <div className="flex-1 overflow-y-auto p-10 bg-white relative z-10" id="invoice-content">
                    {/* Header & Logo */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-wider">HOSPITAL MANAGEMENT NZE</h1>
                            <p className="text-slate-500 mt-2">Excellence in Healthcare</p>
                            <div className="mt-4 text-sm text-slate-600">
                                <p>123 Medical Center Drive</p>
                                <p>Kigali, Rwanda</p>
                                <p>apjr.nzendong@gmail.com</p>
                                <p>+250 790802083</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-4xl font-light text-slate-400">INVOICE</h2>
                            <div className="mt-4 text-slate-700">
                                <div className="flex justify-end gap-4">
                                    <span className="font-semibold">Invoice #:</span>
                                    <span>{bill.id}</span>
                                </div>
                                <div className="flex justify-end gap-4 mt-1">
                                    <span className="font-semibold">Date:</span>
                                    <span>{new Date(bill.issuedDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-end gap-4 mt-1">
                                    <span className="font-semibold">Time:</span>
                                    <span>{new Date(bill.issuedDate).toLocaleTimeString()}</span>
                                </div>
                                <div className="flex justify-end gap-4 mt-1">
                                    <span className="font-semibold">Status:</span>
                                    <span className={`uppercase font-bold ${bill.status === 'Paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {bill.status}
                                    </span>
                                </div>
                                {bill.paymentMethod && (
                                    <div className="flex justify-end gap-4 mt-1">
                                        <span className="font-semibold">Payment Method:</span>
                                        <span>{bill.paymentMethod}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bill To / Bill From */}
                    <div className="grid grid-cols-2 gap-12 mb-12">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Bill To</h3>
                            <div className="text-slate-800 font-medium text-lg">{patient?.fullName || "N/A"}</div>
                            <div className="text-slate-600 mt-2 text-sm">
                                <p>{patient?.email}</p>
                                <p>{patient?.phone}</p>
                                {/* Address could go here if available */}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Doctor / Department</h3>
                            <div className="text-slate-800 font-medium text-lg">{doctor?.name || "Unknown Doctor"}</div>
                            <div className="text-slate-600 mt-2 text-sm">
                                <p>{doctor?.department?.name || "General"}</p>
                                <p>{doctor?.specialization}</p>
                                <p>{doctor?.contact}</p>
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="mb-12">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-300">
                                    <th className="py-3 font-semibold text-slate-600 text-sm uppercase">Item Description</th>
                                    <th className="py-3 font-semibold text-slate-600 text-sm uppercase text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-slate-200">
                                    <td className="py-4 text-slate-800">
                                        <div className="font-medium">Medical Consultation</div>
                                        <div className="text-sm text-slate-500 mt-1">
                                            Appointment #{bill.appointment?.id} with Dr. {doctor?.name}
                                        </div>
                                    </td>
                                    <td className="py-4 text-right text-slate-800 font-medium">
                                        RWF {bill.amount.toFixed(2)}
                                    </td>
                                </tr>
                                {/* Simple spacer rows if needed for design, or additional items later */}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-16">
                        <div className="w-64">
                            <div className="flex justify-between py-2 border-b border-slate-200 text-slate-600">
                                <span>Subtotal</span>
                                <span>RWF {bill.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-200 text-slate-600">
                                <span>Tax (0%)</span>
                                <span>RWF 0.00</span>
                            </div>
                            <div className="flex justify-between py-4 text-xl font-bold text-slate-900 border-b-2 border-slate-900">
                                <span>Total</span>
                                <span>RWF {bill.amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Signature & Footer */}
                    <div className="grid grid-cols-2 gap-8 items-end">
                        <div className="text-sm text-slate-500">
                            <h4 className="font-bold text-slate-700 mb-2">Terms & Conditions</h4>
                            <p>Payment is due within 14 days of invoice date.</p>
                            <p>Please make checks payable to "Hospital Management NZE".</p>
                            <p className="mt-2 text-xs">Generated by Hospital Management Suite v1.0</p>
                        </div>
                        <div className="text-center relative">
                            {/* Signature Component */}
                            <div className="font-serif text-4xl text-blue-900 italic transform -rotate-6 mb-[-10px]">
                                Authorized
                            </div>
                            <div className="border-b border-slate-900 w-full mb-3 mt-4"></div>
                            <p className="font-bold text-slate-800 uppercase tracking-widest text-sm">Authorized Signature</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillDetailsModal;
