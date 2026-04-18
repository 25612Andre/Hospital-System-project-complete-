import React from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../../api/dashboardApi";
import type { DashboardSummary } from "../../api/dashboardApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AppButton from "../../components/common/AppButton";
import { toast } from "react-toastify";
import { useAuth } from "../../context/useAuth";
import { useI18n } from "../../i18n/I18nProvider";

const DashboardPage: React.FC = () => {
  const { t, language } = useI18n();
  const { data, isLoading, isError, refetch } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: dashboardApi.summary,
    retry: 1,
  });

  const { roles } = useAuth();
  const isAdmin = roles.includes("ADMIN");
  const isDoctor = roles.includes("DOCTOR");
  const isPatient = roles.includes("PATIENT");

  React.useEffect(() => {
    if (isError) toast.error(t("dashboard.error.loadFailedToast"));
  }, [isError, t]);

  if (isLoading || (!data && !isError)) return <LoadingSpinner />;

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-800">{t("nav.dashboard")}</h1>
        <p className="text-sm text-red-600">{t("dashboard.error.unableToLoad")}</p>
        <AppButton variant="secondary" onClick={() => refetch()}>
          {t("common.retry")}
        </AppButton>
      </div>
    );
  }

  const fmt = new Intl.NumberFormat(language);

  type CardId =
    | "patients"
    | "doctors"
    | "departments"
    | "locations"
    | "appointments"
    | "todayAppointments"
    | "completedAppointments"
    | "bills"
    | "revenue";

  type DashboardCard = {
    id: CardId;
    label: string;
    value: number;
    color: string;
    bg: string;
    currency?: boolean;
    visible: boolean;
  };

  // Define all possible cards
  const allCards: DashboardCard[] = [
    {
      id: "patients",
      label: isDoctor ? t("dashboard.cards.myPatients") : t("dashboard.cards.totalPatients"),
      value: data.patients,
      color: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-100",
      visible: !isPatient,
    },
    {
      id: "doctors",
      label: t("dashboard.cards.doctors"),
      value: data.doctors,
      color: "text-blue-700",
      bg: "bg-blue-50 border-blue-100",
      visible: isAdmin,
    },
    {
      id: "departments",
      label: t("dashboard.cards.departments"),
      value: data.departments,
      color: "text-purple-700",
      bg: "bg-purple-50 border-purple-100",
      visible: isAdmin,
    },
    {
      id: "locations",
      label: t("dashboard.cards.locations"),
      value: data.locations,
      color: "text-rose-700",
      bg: "bg-rose-50 border-rose-100",
      visible: isAdmin,
    },
    {
      id: "appointments",
      label: isPatient || isDoctor ? t("dashboard.cards.myAppointments") : t("dashboard.cards.totalAppointments"),
      value: data.appointments,
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-100",
      visible: true,
    },
    {
      id: "todayAppointments",
      label: t("dashboard.cards.todaysVisits"),
      value: data.todayAppointments,
      color: "text-teal-700",
      bg: "bg-teal-50 border-teal-100",
      visible: !isPatient,
    },
    {
      id: "completedAppointments",
      label: t("dashboard.cards.completed"),
      value: data.completedAppointments,
      color: "text-indigo-700",
      bg: "bg-indigo-50 border-indigo-100",
      visible: true,
    },
    {
      id: "bills",
      label: isPatient ? t("dashboard.cards.myBills") : t("dashboard.cards.billsIssued"),
      value: data.bills,
      color: "text-slate-700",
      bg: "bg-slate-50 border-slate-200",
      visible: true,
    },
    {
      id: "revenue",
      label: isPatient ? t("dashboard.cards.totalSpent") : isDoctor ? t("dashboard.cards.myRevenue") : t("dashboard.cards.revenue"),
      value: data.revenue,
      color: "text-green-800",
      bg: "bg-green-50 border-green-200",
      currency: true,
      visible: true,
    },
  ];

  const visibleCards = allCards.filter((c) => c.visible);

  const title = isAdmin ? t("dashboard.title.admin") : isDoctor ? t("dashboard.title.doctor") : t("dashboard.title.patient");
  const subtitle = isAdmin ? t("dashboard.subtitle.admin") : isDoctor ? t("dashboard.subtitle.doctor") : t("dashboard.subtitle.patient");

  const iconPaths: Record<CardId, string> = {
    patients:
      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    doctors:
      "M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    departments:
      "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    locations:
      "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    appointments: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    todayAppointments: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    completedAppointments:
      "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    bills: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    revenue:
      "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-slate-500 mt-1">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {visibleCards.map((card) => {
          const iconPath = iconPaths[card.id];

          return (
            <div
              key={card.id}
              className={`relative overflow-hidden rounded-2xl border ${card.bg} p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-white bg-opacity-60 backdrop-blur-sm`}
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold uppercase tracking-wider text-slate-500">{card.label}</span>
                  <span className={`text-4xl font-extrabold ${card.color} tracking-tight`}>
                    {card.currency ? `FCFA ${fmt.format(card.value)}` : fmt.format(card.value)}
                  </span>
                </div>
                <div className={`p-3 rounded-xl bg-white bg-opacity-50 shadow-sm ${card.color}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPath} />
                  </svg>
                </div>
              </div>
              {/* Decorative circle */}
              <div className={`absolute -right-6 -bottom-6 h-32 w-32 rounded-full opacity-10 ${card.color.replace('text-', 'bg-')} transition-transform group-hover:scale-110`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardPage;
