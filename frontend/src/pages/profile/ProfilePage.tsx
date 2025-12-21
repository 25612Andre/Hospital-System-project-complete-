import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import AppButton from "../../components/common/AppButton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { personApi } from "../../api/personApi";
import { doctorApi } from "../../api/doctorApi";
import { userApi } from "../../api/userApi";
import { toast } from "react-toastify";

const ProfilePage: React.FC = () => {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        password: "",
        fullName: "",
        phone: "",
        specialization: "",
        age: "",
        gender: ""
    });

    const { data: patient } = useQuery({
        queryKey: ["my-patient-profile", user?.patientId],
        queryFn: () => personApi.getById(Number(user?.patientId)),
        enabled: !!user?.patientId,
    });

    const { data: doctor } = useQuery({
        queryKey: ["my-doctor-profile", user?.doctorId],
        queryFn: () => doctorApi.get(Number(user?.doctorId)),
        enabled: !!user?.doctorId,
    });

    useEffect(() => {
        if (isEditing) {
            if (patient) {
                setFormData(prev => ({
                    ...prev,
                    fullName: patient.fullName || "",
                    phone: patient.phone || "",
                    age: String(patient.age || ""),
                    gender: patient.gender || ""
                }));
            } else if (doctor) {
                setFormData(prev => ({
                    ...prev,
                    fullName: doctor.name || "",
                    phone: doctor.contact || "",
                    specialization: doctor.specialization || ""
                }));
            }
        }
    }, [isEditing, patient, doctor]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                username: user?.username, // Required for DTO validation
                role: user?.role,         // Required for DTO validation
                password: formData.password || undefined, // Only send if not empty
                fullName: formData.fullName,
                phone: formData.phone
            };

            if (user?.role === 'PATIENT') {
                payload.age = Number(formData.age);
                payload.gender = formData.gender;
            } else if (user?.role === 'DOCTOR') {
                payload.specialization = formData.specialization;
            }

            await userApi.updateProfile(payload);
            toast.success("Profile updated successfully");
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ["my-patient-profile"] });
            queryClient.invalidateQueries({ queryKey: ["my-doctor-profile"] });
        } catch {
            toast.error("Failed to update profile");
        }
    };

    if (!user) return <div>Not logged in</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
                <div className="flex gap-2">
                    {!isEditing && <AppButton onClick={() => setIsEditing(true)}>Edit Profile</AppButton>}
                    <AppButton variant="secondary" onClick={logout}>Sign Out</AppButton>
                </div>
            </div>

            {isEditing ? (
                <form onSubmit={handleSave} className="bg-white shadow rounded-lg p-6 border border-slate-200 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Edit Details</h2>

                    {/* Common Fields */}
                    {(user.role === 'PATIENT' || user.role === 'DOCTOR') && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                                <input
                                    className="w-full border rounded px-3 py-2 mt-1"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Phone</label>
                                <input
                                    className="w-full border rounded px-3 py-2 mt-1"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {/* Doctor Specific */}
                    {user.role === 'DOCTOR' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Specialization</label>
                            <input
                                className="w-full border rounded px-3 py-2 mt-1"
                                value={formData.specialization}
                                onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                            />
                        </div>
                    )}

                    {/* Patient Specific */}
                    {user.role === 'PATIENT' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Age</label>
                                <input
                                    type="number"
                                    className="w-full border rounded px-3 py-2 mt-1"
                                    value={formData.age}
                                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Gender</label>
                                <select
                                    className="w-full border rounded px-3 py-2 mt-1"
                                    value={formData.gender}
                                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-4 mt-4">
                        <label className="block text-sm font-medium text-slate-700">Change Password (leave blank to keep current)</label>
                        <input
                            type="password"
                            className="w-full border rounded px-3 py-2 mt-1"
                            placeholder="New Password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <AppButton variant="secondary" type="button" onClick={() => setIsEditing(false)}>Cancel</AppButton>
                        <AppButton type="submit">Save Changes</AppButton>
                    </div>
                </form>
            ) : (
                <div className="bg-white shadow rounded-lg p-6 border border-slate-200">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800">{user.username}</h2>
                            <p className="text-sm text-slate-500">{user.role}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-500">Username / Email</label>
                            <div className="mt-1 text-slate-900">{user.username}</div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500">Role</label>
                            <div className="mt-1 text-slate-900">{user.role}</div>
                        </div>
                        {patient && (
                            <>
                                <div className="col-span-2 border-t pt-4">
                                    <h3 className="font-medium text-slate-800 mb-2">Patient Records</h3>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">Name</label>
                                    <div className="mt-1 text-slate-900">{patient.fullName}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">Email</label>
                                    <div className="mt-1 text-slate-900">{patient.email}</div>
                                </div>
                            </>
                        )}
                        {doctor && (
                            <>
                                <div className="col-span-2 border-t pt-4">
                                    <h3 className="font-medium text-slate-800 mb-2">Doctor Profile</h3>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">Name</label>
                                    <div className="mt-1 text-slate-900">{doctor.name}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">Specialization</label>
                                    <div className="mt-1 text-slate-900">{doctor.specialization}</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
