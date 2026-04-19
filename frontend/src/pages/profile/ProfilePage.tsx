import React, { useState } from "react";
import type { AxiosError } from "axios";
import { authApi } from "../../api/authApi";
import { useAuth } from "../../context/useAuth";
import AppButton from "../../components/common/AppButton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { personApi } from "../../api/personApi";
import { doctorApi } from "../../api/doctorApi";
import { userApi } from "../../api/userApi";
import { locationApi } from "../../api/locationApi";
import resolveBackendAssetUrl from "../../api/assetUrl";
import { toast } from "react-toastify";
import { useI18n } from "../../i18n/I18nProvider";

const ProfilePage: React.FC = () => {
    const { user, logout, updateUser } = useAuth();
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePreview, setProfilePreview] = useState<string>("");
    const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
    const [formData, setFormData] = useState({
        password: "",
        fullName: "",
        phone: "",
        specialization: "",
        biography: "",
        age: "",
        gender: "",
        locationName: ""
    });

    const { data: account } = useQuery({
        queryKey: ["my-user-profile"],
        queryFn: userApi.getProfile,
        enabled: !!user,
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

    const patientLocationId = patient?.location?.id ? Number(patient.location.id) : null;
    const doctorLocationId = doctor?.location?.id ? Number(doctor.location.id) : null;
    const accountLocationId = account?.location?.id ? Number(account.location.id) : null;

    const { data: patientLocation } = useQuery({
        queryKey: ["location", patientLocationId],
        queryFn: () => locationApi.getById(patientLocationId as number),
        enabled: !!patientLocationId,
    });

    const { data: doctorLocation } = useQuery({
        queryKey: ["location", doctorLocationId],
        queryFn: () => locationApi.getById(doctorLocationId as number),
        enabled: !!doctorLocationId,
    });

    const { data: accountLocation } = useQuery({
        queryKey: ["location", accountLocationId],
        queryFn: () => locationApi.getById(accountLocationId as number),
        enabled: !!accountLocationId,
    });

    const handleCancel = () => {
        setIsEditing(false);
        setProfilePicture(null);
        setProfilePreview("");
        setAvatarLoadFailed(false);
        setFormData(prev => ({ ...prev, password: "" }));
    };

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = ["image/jpeg", "image/jpg", "image/pjpeg", "image/png", "image/x-png", "image/gif", "image/webp"];
        if (!allowed.includes(file.type)) {
            toast.error(t("common.imageUpload.invalidType"));
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error(t("common.imageUpload.tooLarge", { maxMb: 5 }));
            return;
        }

        setProfilePicture(file);
        setAvatarLoadFailed(false);
        const reader = new FileReader();
        reader.onloadend = () => setProfilePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const startEditing = () => {
        setFormData({
            password: "",
            fullName: patient?.fullName || doctor?.name || "",
            phone: patient?.phone || doctor?.contact || "",
            specialization: doctor?.specialization || "",
            biography: doctor?.biography || "",
            age: patient?.age ? String(patient.age) : "",
            gender: patient?.gender || "",
            locationName: patient?.location?.name || doctor?.location?.name || account?.location?.name || "",
        });
        setAvatarLoadFailed(false);
        setIsEditing(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: Parameters<typeof userApi.updateProfile>[0] = {};

            if (formData.password.trim()) {
                payload.password = formData.password.trim();
            }

            if (user?.role === 'PATIENT') {
                if (formData.fullName.trim()) payload.fullName = formData.fullName.trim();
                if (formData.phone.trim()) payload.phone = formData.phone.trim();
                if (formData.gender) payload.gender = formData.gender;
                if (formData.age.trim()) payload.age = Number(formData.age);
            } else if (user?.role === 'DOCTOR') {
                if (formData.fullName.trim()) payload.fullName = formData.fullName.trim();
                if (formData.phone.trim()) payload.phone = formData.phone.trim();
                if (formData.specialization.trim()) payload.specialization = formData.specialization.trim();
                payload.biography = formData.biography.trim();
            }
            
            if (formData.locationName.trim()) {
                payload.locationName = formData.locationName.trim();
            }

            await userApi.updateProfile(payload);

            if (profilePicture) {
                const updated = await userApi.updateProfilePicture(profilePicture);
                queryClient.setQueryData(["my-user-profile"], updated);
                if (updated?.profilePictureUrl) {
                    updateUser({ profilePictureUrl: updated.profilePictureUrl });
                }
            }

            toast.success(t("profile.toast.updated"));
            setIsEditing(false);
            setProfilePicture(null);
            setProfilePreview("");
            queryClient.invalidateQueries({ queryKey: ["my-patient-profile"] });
            queryClient.invalidateQueries({ queryKey: ["my-doctor-profile"] });
            queryClient.invalidateQueries({ queryKey: ["my-user-profile"] });
        } catch (err) {
            const error = err as AxiosError<{ message?: string; error?: string }>;
            const msg =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                t("profile.toast.updateFailed");
            toast.error(msg);
        }
    };

    const rawAvatarPath =
        account?.profilePictureUrl ||
        user?.profilePictureUrl ||
        patient?.profilePictureUrl ||
        doctor?.profilePictureUrl ||
        "";
    const existingAvatarUrl = resolveBackendAssetUrl(rawAvatarPath);
    const avatarUrl = isEditing && profilePreview ? profilePreview : existingAvatarUrl;

    const handleToggleTwoFactor = async () => {
        if (!user) {
            return;
        }
        const enable = !account?.twoFactorEnabled;
        const confirmMessage = enable
            ? "Enable 2FA? You will need a code from your email to login next time."
            : "Disable 2FA?";
        if (!window.confirm(confirmMessage)) {
            return;
        }
        const password = window.prompt("Please confirm your password to change 2FA settings:");
        if (!password) {
            return;
        }
        try {
            const result = await authApi.setup2fa({
                username: user.username,
                password,
                enable,
            });
            toast.success(result.instructions || (enable ? "2FA Enabled" : "2FA Disabled"));
            queryClient.invalidateQueries({ queryKey: ["my-user-profile"] });
        } catch (err) {
            const error = err as AxiosError<{ message?: string; error?: string }>;
            toast.error(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Verification failed"
            );
        }
    };

    if (!user) return <div>{t("profile.notLoggedIn")}</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 pb-2 pt-4 flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-slate-800">{t("nav.profile")}</h1>
                <div className="flex gap-2">
                    {!isEditing && <AppButton onClick={startEditing}>{t("profile.editProfile")}</AppButton>}
                    <AppButton variant="secondary" onClick={logout}>{t("topbar.logout")}</AppButton>
                </div>
            </div>

            {isEditing ? (
                <form onSubmit={handleSave} className="bg-white shadow rounded-lg p-6 border border-slate-200 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">{t("profile.editDetails")}</h2>

                    {/* Profile Picture */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t("signup.profilePictureOptional")}</label>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center overflow-hidden">
                                {avatarUrl && !avatarLoadFailed ? (
                                    <img
                                        src={avatarUrl}
                                        alt={t("profile.profilePicturePreviewAlt")}
                                        className="w-full h-full object-cover"
                                        onError={() => setAvatarLoadFailed(true)}
                                    />
                                ) : (
                                    <div className="text-indigo-600 text-2xl font-bold">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    id="profile-picture"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleProfilePictureChange}
                                />
                                <label
                                    htmlFor="profile-picture"
                                    className="inline-block cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {t("common.choosePhoto")}
                                </label>
                                {profilePicture && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProfilePicture(null);
                                            setProfilePreview("");
                                        }}
                                        className="ml-2 text-sm text-red-600 hover:text-red-700"
                                    >
                                        {t("common.remove")}
                                    </button>
                                )}
                                <p className="text-xs text-slate-500 mt-1">{t("common.imageUpload.hint", { maxMb: 5 })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Common Fields */}
                    {(user.role === 'PATIENT' || user.role === 'DOCTOR') && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t("signup.fullName")}</label>
                                <input
                                    className="w-full border rounded px-3 py-2 mt-1 disabled:bg-slate-100 disabled:text-slate-500"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    disabled={user.role === 'PATIENT'}
                                />
                                {user.role === 'PATIENT' && <p className="text-[10px] text-slate-400 mt-1">Contact administrator to update personal details</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t("signup.phone")}</label>
                                <input
                                    className="w-full border rounded px-3 py-2 mt-1 disabled:bg-slate-100 disabled:text-slate-500"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={user.role === 'PATIENT'}
                                />
                            </div>
                        </>
                    )}

                    {/* Doctor Specific */}
                    {user.role === 'DOCTOR' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t("common.specialization")}</label>
                                <input
                                    className="w-full border rounded px-3 py-2 mt-1"
                                    value={formData.specialization}
                                    onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t("profile.doctorBiography")}</label>
                                <textarea
                                    className="w-full border rounded px-3 py-2 mt-1"
                                    rows={4}
                                    placeholder={t("profile.doctorBiographyPlaceholder")}
                                    value={formData.biography}
                                    onChange={e => setFormData({ ...formData, biography: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {/* Patient Specific */}
                    {user.role === 'PATIENT' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t("signup.age")}</label>
                                <input
                                    type="number"
                                    className="w-full border rounded px-3 py-2 mt-1 disabled:bg-slate-100 disabled:text-slate-500"
                                    value={formData.age}
                                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                                    disabled={user.role === 'PATIENT'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t("signup.gender")}</label>
                                <select
                                    className="w-full border rounded px-3 py-2 mt-1 disabled:bg-slate-100 disabled:text-slate-500"
                                    value={formData.gender}
                                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                    disabled={user.role === 'PATIENT'}
                                >
                                    <option value="">{t("signup.gender.select")}</option>
                                    <option value="MALE">{t("signup.gender.male")}</option>
                                    <option value="FEMALE">{t("signup.gender.female")}</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-4 mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t("common.location")}</label>
                            <input
                                className="w-full border rounded px-3 py-2 mt-1 disabled:bg-slate-100 disabled:text-slate-500"
                                placeholder="Enter your city or area..."
                                value={formData.locationName}
                                onChange={e => setFormData({ ...formData, locationName: e.target.value })}
                                disabled={user.role === 'PATIENT'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t("profile.changePasswordHint")}</label>
                            <input
                                type="password"
                                className="w-full border rounded px-3 py-2 mt-1"
                                placeholder={t("profile.newPassword")}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <AppButton variant="secondary" type="button" onClick={handleCancel}>{t("common.cancel")}</AppButton>
                        <AppButton type="submit">{t("common.save")}</AppButton>
                    </div>
                </form>
            ) : (
                <div className="bg-white shadow rounded-lg p-6 border border-slate-200">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold overflow-hidden">
                            {existingAvatarUrl && !avatarLoadFailed ? (
                                <img
                                    src={existingAvatarUrl}
                                    alt={t("topbar.profilePictureAlt")}
                                    className="h-full w-full object-cover"
                                    onError={() => setAvatarLoadFailed(true)}
                                />
                            ) : (
                                user.username.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800">{user.username}</h2>
                            <p className="text-sm text-slate-500">{user.role}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-500">{t("signup.emailUsername")}</label>
                            <div className="mt-1 text-slate-900">{user.username}</div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500">{t("common.role")}</label>
                            <div className="mt-1 text-slate-900">{user.role}</div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500">{t("profile.twoFactorAuthentication")}</label>
                            <div className="mt-1 flex items-center gap-3">
                                <span className={`text-sm font-semibold ${account?.twoFactorEnabled ? 'text-emerald-600' : 'text-slate-600'}`}>
                                    {account?.twoFactorEnabled ? t("common.enabled") : t("common.disabled")}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleToggleTwoFactor}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium"
                                >
                                    {account?.twoFactorEnabled ? "Disable" : "Enable"}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500">{t("common.location")}</label>
                            <div className="mt-1 text-slate-900">
                                {patientLocation?.path || doctorLocation?.path || accountLocation?.path || account?.location?.name || t("common.na")}
                            </div>
                        </div>
                        {patient && (
                            <>
                                <div className="col-span-2 border-t pt-4">
                                    <h3 className="font-medium text-slate-800 mb-2">{t("profile.patientRecords")}</h3>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">{t("common.name")}</label>
                                    <div className="mt-1 text-slate-900">{patient.fullName}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">{t("common.email")}</label>
                                    <div className="mt-1 text-slate-900">{patient.email}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">{t("signup.phone")}</label>
                                    <div className="mt-1 text-slate-900">{patient.phone}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">{t("signup.age")}</label>
                                    <div className="mt-1 text-slate-900">{patient.age}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">{t("signup.gender")}</label>
                                    <div className="mt-1 text-slate-900">{patient.gender}</div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-500">{t("profile.patientLocation")}</label>
                                    <div className="mt-1 text-slate-900">{patientLocation?.path || patient.location?.name || t("common.na")}</div>
                                </div>
                            </>
                        )}
                        {doctor && (
                            <>
                                <div className="col-span-2 border-t pt-4">
                                    <h3 className="font-medium text-slate-800 mb-2">{t("signup.doctorProfile")}</h3>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">{t("common.name")}</label>
                                    <div className="mt-1 text-slate-900">{doctor.name}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">{t("common.contact")}</label>
                                    <div className="mt-1 text-slate-900">{doctor.contact}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">{t("common.specialization")}</label>
                                    <div className="mt-1 text-slate-900">{doctor.specialization}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">{t("common.department")}</label>
                                    <div className="mt-1 text-slate-900">{doctor.department?.name || t("common.na")}</div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-500">{t("profile.doctorBiography")}</label>
                                    <div className="mt-1 whitespace-pre-line text-slate-900">{doctor.biography || t("common.na")}</div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-500">{t("profile.doctorLocation")}</label>
                                    <div className="mt-1 text-slate-900">{doctorLocation?.path || doctor.location?.name || t("common.na")}</div>
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
