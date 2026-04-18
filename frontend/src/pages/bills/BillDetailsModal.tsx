import React from "react";
import { useI18n } from "../../i18n/I18nProvider";
import AppButton from "../../components/common/AppButton";
import type { Bill } from "../../api/billApi";

interface BillDetailsModalProps {
    bill: Bill;
    onClose: () => void;
}

const BillDetailsModal: React.FC<BillDetailsModalProps> = ({ bill, onClose }) => {
    const { t } = useI18n();
    const patient = bill.appointment?.patient;
    const doctor = bill.appointment?.doctor;

    return (
        <>
            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #invoice-content, #invoice-content * {
                        visibility: visible;
                    }
                    #invoice-content {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 2cm 1.5cm;
                        background: white;
                    }
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    .print-break {
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:p-0">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:rounded-none">
                    {/* Modal Header (Actions) */}
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-600 to-primary-700 border-b print:hidden">
                        <h2 className="text-lg font-semibold text-white">{t("bills.invoice.title")}</h2>
                        <div className="flex gap-2">
                            <AppButton variant="secondary" onClick={() => window.print()}>
                                🖨️ {t("bills.invoice.print")}
                            </AppButton>
                            <AppButton variant="primary" onClick={onClose}>
                                {t("bills.invoice.close")}
                            </AppButton>
                        </div>
                    </div>

                    {/* Invoice Content (Printable Area) */}
                    <div className="flex-1 overflow-y-auto p-12 bg-white relative print:overflow-visible print:p-0" id="invoice-content">
                        {/* Watermark Background */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02] z-0 print:opacity-[0.03]">
                            <svg width="800" height="800" viewBox="0 0 24 24" fill="currentColor" className="text-primary-900">
                                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 10h7c-.53 4.12-3.28 7.79-7 8.94V12H5V7.3l7-3.11V12z" />
                            </svg>
                        </div>

                        {/* Header with Logo and Branding */}
                        <div className="relative z-10 mb-8 pb-6 border-b-4 border-primary-600 print-break">
                            <div className="flex justify-between items-start">
                                {/* Hospital Logo and Info */}
                                <div className="flex items-start gap-4">
                                    {/* Logo */}
                                    <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-lg print:shadow-md">
                                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />
                                        </svg>
                                    </div>
                                    {/* Hospital Details */}
                                    <div>
                                        <h1 className="text-3xl font-bold text-slate-900 mb-1">
                                            HOSPITAL MANAGEMENT NZE
                                        </h1>
                                        <p className="text-primary-600 font-semibold text-sm mb-3">Excellence in Healthcare Since 2024</p>
                                        <div className="text-sm text-slate-600 space-y-0.5">
                                            <p className="flex items-center gap-2">
                                                <span className="text-primary-600">📍</span>
                                                123 Medical Center Drive, Kigali, Rwanda
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="text-primary-600">📧</span>
                                                apjr.nzendong@gmail.com
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="text-primary-600">📞</span>
                                                +250 790 802 083
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="text-primary-600">🌐</span>
                                                www.hospitalnze.rw
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Invoice Details */}
                                <div className="text-right">
                                    <div className="bg-gradient-to-br from-primary-50 to-primary-100 px-6 py-4 rounded-lg border-2 border-primary-200">
                                        <h2 className="text-3xl font-bold text-primary-900 mb-3">{t("bills.invoice.invoiceTitle")}</h2>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between gap-6">
                                                <span className="font-semibold text-slate-700">{t("bills.invoice.invoiceNumber")}:</span>
                                                <span className="font-mono font-bold text-primary-700">INV-{String(bill.id).padStart(6, '0')}</span>
                                            </div>
                                            <div className="flex justify-between gap-6">
                                                <span className="font-semibold text-slate-700">{t("bills.invoice.date")}:</span>
                                                <span className="font-mono">{new Date(bill.issuedDate).toLocaleDateString('en-GB')}</span>
                                            </div>
                                            <div className="flex justify-between gap-6">
                                                <span className="font-semibold text-slate-700">{t("bills.invoice.time")}:</span>
                                                <span className="font-mono">{new Date(bill.issuedDate).toLocaleTimeString('en-GB')}</span>
                                            </div>
                                            <div className="flex justify-between gap-6 pt-2 border-t border-primary-200">
                                                <span className="font-semibold text-slate-700">{t("bills.invoice.status")}:</span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${bill.status === 'Paid'
                                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                                    : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                                    }`}>
                                                    {bill.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bill To / Service Provider */}
                        <div className="grid grid-cols-2 gap-8 mb-8 print-break">
                            {/* Patient Info */}
                            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                                <h3 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span>👤</span> {t("bills.invoice.patientInfo")}
                                </h3>
                                <div className="text-slate-900 font-bold text-lg mb-3">{patient?.fullName || "N/A"}</div>
                                <div className="text-slate-600 text-sm space-y-1">
                                    <p className="flex items-center gap-2">
                                        <span className="text-slate-400">📧</span>
                                        {patient?.email || "N/A"}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="text-slate-400">📞</span>
                                        {patient?.phone || "N/A"}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="text-slate-400">🆔</span>
                                        Patient ID: {patient?.id}
                                    </p>
                                </div>
                            </div>

                            {/* Doctor/Department Info */}
                            <div className="bg-primary-50 p-6 rounded-lg border border-primary-200">
                                <h3 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span>⚕️</span> {t("bills.invoice.serviceProvider")}
                                </h3>
                                <div className="text-slate-900 font-bold text-lg mb-3">Dr. {doctor?.name || "Unknown"}</div>
                                <div className="text-slate-600 text-sm space-y-1">
                                    <p className="flex items-center gap-2">
                                        <span className="text-primary-400">🏥</span>
                                        {doctor?.department?.name || "General"}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="text-primary-400">🩺</span>
                                        {doctor?.specialization || "N/A"}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="text-primary-400">📞</span>
                                        {doctor?.contact || "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Services Table */}
                        <div className="mb-8 print-break">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">{t("bills.invoice.servicesRendered")}</h3>
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-y-2 border-slate-300">
                                        <th className="py-4 px-4 text-left font-semibold text-slate-700 text-sm uppercase">{t("bills.invoice.description")}</th>
                                        <th className="py-4 px-4 text-center font-semibold text-slate-700 text-sm uppercase">{t("bills.invoice.qty")}</th>
                                        <th className="py-4 px-4 text-right font-semibold text-slate-700 text-sm uppercase">{t("bills.invoice.unitPrice")}</th>
                                        <th className="py-4 px-4 text-right font-semibold text-slate-700 text-sm uppercase">{t("bills.invoice.amount")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-200 hover:bg-slate-50 print:hover:bg-transparent">
                                        <td className="py-4 px-4">
                                            <div className="font-semibold text-slate-900">{t("bills.invoice.consultation")}</div>
                                            <div className="text-sm text-slate-500 mt-1">
                                                Appointment #{bill.appointment?.id} • {new Date(bill.appointment?.appointmentDate || '').toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                {t("bills.invoice.attendedBy", { name: doctor?.name || "" })}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center text-slate-700">1</td>
                                        <td className="py-4 px-4 text-right text-slate-700 font-mono">FCFA {bill.amount.toLocaleString()}</td>
                                        <td className="py-4 px-4 text-right text-slate-900 font-semibold font-mono">FCFA {bill.amount.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Payment Summary */}
                        <div className="flex justify-end mb-10 print-break">
                            <div className="w-80 bg-slate-50 p-6 rounded-lg border-2 border-slate-200">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-slate-600">
                                        <span>{t("bills.invoice.subtotal")}:</span>
                                        <span className="font-mono">RWF {bill.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>{t("bills.invoice.tax")}:</span>
                                        <span className="font-mono">RWF 0.00</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>{t("bills.invoice.discount")}:</span>
                                        <span className="font-mono">RWF 0.00</span>
                                    </div>
                                    <div className="border-t-2 border-slate-300 pt-3 flex justify-between text-xl font-bold text-slate-900">
                                        <span>{t("bills.invoice.total")}:</span>
                                        <span className="font-mono text-primary-700">RWF {bill.amount.toLocaleString()}</span>
                                    </div>
                                    {bill.paymentMethod && (
                                        <div className="pt-3 border-t border-slate-200 flex justify-between text-sm">
                                            <span className="text-slate-600">{t("bills.invoice.paymentMethod")}:</span>
                                            <span className="font-semibold text-slate-900">{bill.paymentMethod}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Section with Signature and Stamp */}
                        <div className="border-t-2 border-slate-200 pt-8 print-break">
                            <div className="grid grid-cols-3 gap-8 items-end">
                                {/* Terms & Conditions */}
                                <div className="col-span-1">
                                    <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">{t("bills.invoice.termsConditions")}</h4>
                                    <div className="text-xs text-slate-600 space-y-1">
                                        <p>• Payment due within 14 days</p>
                                        <p>• Late payments subject to 2% monthly interest</p>
                                        <p>• All payments non-refundable</p>
                                        <p>• Make checks payable to "Hospital Management NZE"</p>
                                    </div>
                                    <p className="mt-4 text-xs text-slate-400 italic">
                                        Generated by Hospital Management Suite v1.0
                                    </p>
                                </div>

                                {/* Official Stamp */}
                                <div className="col-span-1 flex flex-col items-center">
                                    <div className="relative">
                                        {/* Circular Stamp */}
                                        <div className="w-32 h-32 rounded-full border-4 border-red-600 flex items-center justify-center relative bg-white/50">
                                            <div className="text-center">
                                                <div className="text-xs font-bold text-red-700 leading-tight">
                                                    HOSPITAL<br />MANAGEMENT<br />NZE
                                                </div>
                                                <div className="text-[10px] text-red-600 mt-1">OFFICIAL SEAL</div>
                                            </div>
                                            {/* Stamp Date */}
                                            <div className="absolute bottom-2 text-[8px] font-mono text-red-700">
                                                {new Date().toLocaleDateString('en-GB').replace(/\//g, '.')}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 font-semibold">{t("bills.invoice.officialStamp")}</p>
                                </div>

                                {/* Authorized Signature */}
                                <div className="col-span-1 flex flex-col items-center">
                                    <div className="w-full">
                                        {/* Signature */}
                                        <div className="h-20 flex items-center justify-center mb-2">
                                            <div className="font-serif text-4xl text-primary-900 italic transform -rotate-6">
                                                NZE Andre
                                            </div>
                                        </div>
                                        {/* Signature Line */}
                                        <div className="border-t-2 border-slate-900 pt-2">
                                            <p className="text-center font-bold text-slate-800 text-sm">{t("bills.invoice.authorizedSignature")}</p>
                                            <p className="text-center text-xs text-slate-500 mt-1">{t("bills.invoice.financialDirector")}</p>
                                            <p className="text-center text-xs text-slate-400 font-mono mt-1">
                                                {new Date().toLocaleDateString('en-GB')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Footer */}
                        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                            <p className="text-xs text-slate-500">
                                {t("bills.invoice.footerNote")}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                {t("bills.invoice.contact")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BillDetailsModal;
