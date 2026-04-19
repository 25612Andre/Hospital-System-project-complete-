import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { personApi, type Person } from "../../api/personApi";
import { appointmentApi, type Appointment } from "../../api/appointmentApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import resolveBackendAssetUrl from "../../api/assetUrl";
import { useI18n } from "../../i18n/I18nProvider";

const PersonDetailPage: React.FC = () => {
  const { id } = useParams();
  const personId = Number(id);
  const { language, t } = useI18n();

  const { data, isLoading } = useQuery<Person>({
    queryKey: ["patient", personId],
    queryFn: () => personApi.getById(personId),
    enabled: !!personId,
  });

  const { data: appointments } = useQuery({
    queryKey: ["patient-appointments", personId],
    queryFn: () => appointmentApi.listPage({ patientId: personId, sort: "appointmentDate,desc", size: 50 }),
    enabled: !!personId,
  });

  if (isLoading || !data) return <LoadingSpinner />;

  const resolvedLocation = data.location?.path || data.location?.name || data.locationName || t("personDetail.notSpecified");

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t("personDetail.title")}</h1>
      </div>

      <div className="bg-white rounded-3xl border border-indigo-100 shadow-xl overflow-hidden flex flex-col md:flex-row shadow-indigo-100/50">
        <div className="w-full md:w-64 bg-slate-50 p-6 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-100">
          <div className="w-40 h-40 rounded-3xl overflow-hidden bg-white border-4 border-white shadow-lg shrink-0 mb-4 ring-1 ring-slate-100">
            {data.profilePictureUrl ? (
              <img
                src={resolveBackendAssetUrl(data.profilePictureUrl)}
                alt={data.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-indigo-300 bg-white">
                {data.fullName.charAt(0)}
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-800 text-center">{data.fullName}</h2>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] uppercase font-bold mt-2">
            {t("entity.patient")}
          </span>
        </div>

        <div className="flex-1 p-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
          <div className="sm:col-span-2 border-b border-slate-50 pb-2 mb-2 font-bold text-slate-900 uppercase text-xs tracking-widest">
            {t("personDetail.generalInformation")}
          </div>
          <div>
            <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
              {t("personDetail.fullName")}
            </span>
            <div className="text-slate-800 font-medium">{data.fullName}</div>
          </div>
          <div>
            <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
              {t("personDetail.ageGender")}
            </span>
            <div className="text-slate-800 font-medium">
              {data.age} {t("personDetail.years")} | {data.gender}
            </div>
          </div>
          <div>
            <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
              {t("personDetail.contactEmail")}
            </span>
            <div className="text-slate-800 font-medium">{data.email}</div>
          </div>
          <div>
            <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
              {t("personDetail.phoneNumber")}
            </span>
            <div className="text-slate-800 font-medium">{data.phone || t("common.na")}</div>
          </div>
          <div className="sm:col-span-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
              {t("personDetail.location")}
            </span>
            <div className="text-slate-700 font-medium">{resolvedLocation}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span className="p-1 shadow-sm rounded-lg bg-indigo-50 text-indigo-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </span>
          {t("personDetail.medicalHistory")}
        </h3>

        {!appointments?.content || appointments.content.length === 0 ? (
          <div className="p-10 text-center bg-white border border-dashed rounded-3xl text-slate-400 font-medium">
            {t("personDetail.noConsultations")}
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.content.map((apt: Appointment) => (
              <div key={apt.id} className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-4 items-center">
                    <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg"># {apt.id}</div>
                    <div className="text-sm font-bold text-slate-800">
                      {new Date(apt.appointmentDate).toLocaleDateString(language, { dateStyle: "long" })}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      apt.status.toLowerCase() === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>
                <div className="text-sm text-slate-600 mb-4">
                  {t("personDetail.consultationWith", {
                    name: apt.doctor?.name || t("common.na"),
                    specialization: apt.doctor?.specialization || t("common.na"),
                  })}
                </div>
                {apt.notes && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border-l-4 border-indigo-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      {t("personDetail.summaryObservations")}
                    </span>
                    <p className="text-sm text-slate-700 whitespace-pre-line line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                      {apt.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonDetailPage;
