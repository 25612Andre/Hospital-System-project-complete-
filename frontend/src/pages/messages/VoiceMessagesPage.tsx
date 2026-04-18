import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { voiceMessageApi } from "../../api/voiceMessageApi";
import { userApi } from "../../api/userApi";
import { useI18n } from "../../i18n/I18nProvider";
import AppButton from "../../components/common/AppButton";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const AccessibleAudioPlayer: React.FC<{ messageId: number; contentType?: string }> = ({ messageId, contentType }) => {
    const [audioUrl, setAudioUrl] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let url = "";
        const loadAudio = async () => {
            try {
                const blob = await voiceMessageApi.getAudioBlob(messageId);
                if (!blob || blob.size === 0) {
                    console.error("Received empty audio blob for message", messageId);
                    setError(true);
                    setLoading(false);
                    return;
                }
                url = URL.createObjectURL(blob);
                setAudioUrl(url);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load audio", err);
                setError(true);
                setLoading(false);
            }
        };

        loadAudio();

        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [messageId]);

    if (loading) return <div className="h-10 flex items-center px-4 text-xs text-slate-400 italic">Chargement de l'audio...</div>;
    if (error) return <div className="h-10 flex items-center px-4 text-xs text-rose-500 italic">Erreur lors de la lecture</div>;

    return (
        <audio
            src={audioUrl}
            controls
            className="h-10 w-full"
        >
            {contentType && <source src={audioUrl} type={contentType} />}
        </audio>
    );
};

const VoiceMessagesPage: React.FC = () => {
    const { t, language } = useI18n();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<"inbox" | "sent">("inbox");
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>("");
    const [selectedRecipientId, setSelectedRecipientId] = useState<number | "">("");
    const [searchRecipient, setSearchRecipient] = useState("");
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowUserDropdown(false);
            }
        };
        if (showUserDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showUserDropdown]);

    const { data: inbox, isLoading: loadingInbox } = useQuery({
        queryKey: ["voice-messages", "inbox"],
        queryFn: voiceMessageApi.getInbox,
    });

    const { data: sent, isLoading: loadingSent } = useQuery({
        queryKey: ["voice-messages", "sent"],
        queryFn: voiceMessageApi.getSent,
    });

    const { data: usersData, isFetching: searching, isError, error } = useQuery({
        queryKey: ["users-search", searchRecipient],
        queryFn: () => userApi.list({ q: searchRecipient, page: 0, size: 10 }),
        enabled: searchRecipient.length >= 1 && showUserDropdown && !selectedRecipientId,
        placeholderData: (previousData: any) => previousData,
        retry: false,
    });

    const sendMutation = useMutation({
        mutationFn: async ({ recipientId, audio }: { recipientId: number; audio: Blob }) => {
            if (audio.size === 0) {
                throw new Error("L'enregistrement est vide.");
            }
            const mime = audio.type || "audio/webm";
            let ext = "webm";
            if (mime.includes("ogg")) ext = "ogg";
            else if (mime.includes("mpeg") || mime.includes("mp3")) ext = "mp3";
            else if (mime.includes("wav")) ext = "wav";
            else if (mime.includes("mp4") || mime.includes("m4a")) ext = "m4a";
            else if (mime.includes("aac")) ext = "aac";

            console.log("Sending audio:", mime, "Extension:", ext, "Size:", audio.size);
            const file = new File([audio], `voice-message-${Date.now()}.${ext}`, { type: mime });
            return voiceMessageApi.send(recipientId, file);
        },
        onSuccess: () => {
            toast.success(t("messages.sentSuccess"));
            queryClient.invalidateQueries({ queryKey: ["voice-messages"] });
            clearRecording();
            setSelectedRecipientId("");
            setSearchRecipient("");
        },
        onError: (err: any) => {
            console.error("Send failed:", err);
            const msg = err.response?.data?.message || err.message || t("messages.sendError");
            toast.error("Échec de l'envoi: " + msg);
        },
    });

    const markReadMutation = useMutation({
        mutationFn: voiceMessageApi.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["voice-messages"] });
        },
    });

    const startRecording = async () => {
        try {
            if (!navigator.mediaDevices || !window.MediaRecorder) {
                toast.error(t("appointments.consultationNote.audio.notSupported"));
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            audioChunksRef.current = [];

            // Try to find a supported mime type
            const mimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav'];
            let selectedType = '';
            for (const type of mimeTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    selectedType = type;
                    break;
                }
            }

            console.log("Starting recording with mime type:", selectedType);
            const recorder = new MediaRecorder(stream, selectedType ? { mimeType: selectedType } : {});
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const mimeType = recorder.mimeType || selectedType || "audio/webm";
                const blob = new Blob(audioChunksRef.current, { type: mimeType });
                console.log("Recording finished. Size:", blob.size, "Type:", mimeType);
                setAudioBlob(blob);
                setAudioPreviewUrl(URL.createObjectURL(blob));
            };

            recorder.start();
            setIsRecording(true);
        } catch (err: any) {
            console.error("Recording error:", err);
            const errorMsg = err.name === 'NotAllowedError'
                ? "Permission au micro refusée. Veuillez l'autoriser dans votre navigateur."
                : (err.name === 'NotFoundError' ? "Aucun microphone détecté." : t("messages.recordingError"));
            toast.error(errorMsg);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaStreamRef.current?.getTracks().forEach(t => t.stop());
            setIsRecording(false);
        }
    };

    const clearRecording = () => {
        setAudioBlob(null);
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl("");
    };

    const handleSend = () => {
        if (!selectedRecipientId || !audioBlob) {
            toast.warn(t("messages.validationError"));
            return;
        }
        sendMutation.mutate({ recipientId: Number(selectedRecipientId), audio: audioBlob });
    };

    const formatTimestamp = (ts: string) => {
        return new Date(ts).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US');
    };

    const messages = tab === "inbox" ? inbox : sent;
    const isLoading = tab === "inbox" ? loadingInbox : loadingSent;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t("messages.title")}</h1>
                    <p className="text-slate-500 mt-1">{t("messages.subtitle")}</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setTab("inbox")}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'inbox' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        {t("messages.inbox")}
                    </button>
                    <button
                        onClick={() => setTab("sent")}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'sent' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        {t("messages.sent")}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* New Message Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                        <h2 className="text-xl font-semibold text-slate-800">{t("messages.newVoiceMessage")}</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t("messages.recipient")}</label>
                                {selectedRecipientId ? (
                                    <div className="flex items-center justify-between bg-primary-50 border border-primary-100 rounded-xl px-4 py-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs">
                                                {searchRecipient.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-semibold text-primary-900">{searchRecipient}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedRecipientId("");
                                                setSearchRecipient("");
                                            }}
                                            className="text-primary-600 hover:text-primary-800"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder={t("messages.searchUsers")}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                            value={searchRecipient}
                                            onFocus={() => setShowUserDropdown(true)}
                                            onChange={(e) => {
                                                setSearchRecipient(e.target.value);
                                                setShowUserDropdown(true);
                                                setSelectedRecipientId("");
                                            }}
                                        />
                                        {searching && (
                                            <div className="absolute right-3 top-2.5">
                                                <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                        {searchRecipient.length >= 1 && showUserDropdown && (
                                            <div ref={dropdownRef} className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] overflow-hidden max-h-60 overflow-y-auto">
                                                {isError ? (
                                                    <div className="px-4 py-3 text-sm text-rose-500 italic">
                                                        Erreur: {(error as any)?.response?.data?.message || (error as any)?.message || "Échec de la recherche"}
                                                    </div>
                                                ) : usersData?.content && usersData.content.length > 0 ? (
                                                    usersData.content.map(user => (
                                                        <button
                                                            key={user.id}
                                                            type="button"
                                                            className="w-full px-4 py-3 text-left hover:bg-primary-50 flex items-center gap-3 border-b border-slate-100 last:border-0 transition-colors group"
                                                            onMouseDown={(e) => {
                                                                // Crucial: prevents blurred input from hiding dropdown before selection is processed
                                                                e.preventDefault();
                                                                setSelectedRecipientId(user.id);
                                                                setSearchRecipient(user.doctor?.name || user.patient?.fullName || user.username);
                                                                setShowUserDropdown(false);
                                                            }}
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                                                {(user.doctor?.name || user.patient?.fullName || user.username).charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-slate-900 truncate">
                                                                    {user.doctor?.name || user.patient?.fullName || user.username}
                                                                </p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-primary-100 group-hover:text-primary-700">
                                                                        {user.role}
                                                                    </span>
                                                                    {(user.doctor || user.patient) && (
                                                                        <span className="text-xs text-slate-400 truncate group-hover:text-primary-400">
                                                                            {user.username}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-sm text-slate-500 italic">
                                                        {searching ? t("common.loading") : `Aucun utilisateur trouvé pour "${searchRecipient}"`}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center space-y-4">
                                {isRecording ? (
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center animate-pulse">
                                            <div className="w-4 h-4 bg-rose-600 rounded-sm"></div>
                                        </div>
                                        <p className="text-sm font-medium text-rose-600">{t("messages.recording")}...</p>
                                        <AppButton variant="secondary" className="bg-white" onClick={stopRecording}>
                                            {t("messages.stop")}
                                        </AppButton>
                                    </div>
                                ) : audioPreviewUrl ? (
                                    <div className="w-full flex flex-col items-center space-y-4">
                                        <audio src={audioPreviewUrl} controls className="w-full" />
                                        <div className="flex gap-2">
                                            <AppButton variant="secondary" onClick={clearRecording}>
                                                {t("messages.clear")}
                                            </AppButton>
                                            <AppButton onClick={handleSend} disabled={sendMutation.isPending}>
                                                {sendMutation.isPending ? t("common.saving") : t("messages.send")}
                                            </AppButton>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                                            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-slate-500 text-center">{t("messages.clickToRecord")}</p>
                                        <AppButton onClick={startRecording}>
                                            {t("messages.startRecording")}
                                        </AppButton>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Message List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm min-h-[500px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full py-20">
                                <LoadingSpinner />
                            </div>
                        ) : !messages || messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <svg className="w-20 h-20 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-xl font-medium">{t("messages.noMessages")}</p>
                                <p className="text-sm mt-1">{t("messages.startConversation")}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`p-6 transition-all hover:bg-slate-50/80 ${tab === 'inbox' && !msg.isRead ? 'bg-primary-50/30' : ''}`}
                                        onMouseEnter={() => tab === 'inbox' && !msg.isRead && markReadMutation.mutate(msg.id)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                                    {(tab === 'inbox' ? msg.senderName : msg.recipientName).charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-slate-900 truncate">
                                                            {tab === 'inbox' ? msg.senderName : msg.recipientName}
                                                        </h3>
                                                        {tab === 'inbox' && !msg.isRead && (
                                                            <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-500 mt-0.5">{formatTimestamp(msg.timestamp)}</p>
                                                </div>
                                            </div>
                                            {tab === 'inbox' ? (
                                                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-full">{t("messages.received")}</span>
                                            ) : (
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{t("messages.sent_label")}</span>
                                            )}
                                        </div>
                                        <div className="mt-4 pl-16">
                                            <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm max-w-md w-full">
                                                <AccessibleAudioPlayer messageId={msg.id} contentType={msg.audioContentType} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceMessagesPage;
