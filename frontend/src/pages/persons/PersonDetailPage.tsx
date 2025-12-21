import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { personApi } from "../../api/personApi";
import type { Person } from "../../api/personApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AppButton from "../../components/common/AppButton";

const PersonDetailPage: React.FC = () => {
  const { id } = useParams();
  const personId = Number(id);
  const { data, isLoading } = useQuery<Person>({
    queryKey: ["patient", personId],
    queryFn: () => personApi.getById(personId),
    enabled: !!personId,
  });

  if (isLoading || !data) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">Patient Details</h1>
        <Link to={`/patients/${personId}/edit`}>
          <AppButton variant="secondary">Edit</AppButton>
        </Link>
      </div>
      <div className="bg-white p-4 rounded-md shadow-sm border space-y-2 text-sm">
        <div><strong>Full Name:</strong> {data.fullName}</div>
        <div><strong>Email:</strong> {data.email}</div>
        <div><strong>Phone:</strong> {data.phone}</div>
        <div><strong>Age:</strong> {data.age}</div>
        <div><strong>Gender:</strong> {data.gender}</div>
        <div>
          <strong>Location:</strong> {data.location?.path || data.location?.name || "N/A"}
        </div>
      </div>
    </div>
  );
};

export default PersonDetailPage;
