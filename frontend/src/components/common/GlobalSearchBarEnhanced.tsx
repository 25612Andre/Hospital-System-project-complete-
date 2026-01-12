import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../../api/dashboardApi";
import type { SearchResultDTO } from "../../dto/SearchResultDTO";
import { useI18n } from "../../i18n/I18nProvider";

const GlobalSearchBarEnhanced: React.FC = () => {
    const { t } = useI18n();
    const [term, setTerm] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Fetch search results as user types
    const { data: searchResults, isLoading } = useQuery<Record<string, SearchResultDTO[]>>({
        queryKey: ["global-search-autocomplete", term],
        queryFn: () => dashboardApi.globalSearch(term),
        enabled: term.length > 0,
        staleTime: 1000,
    });

    // Flatten results for dropdown
    const flatResults = React.useMemo(() => {
        if (!searchResults) return [];
        const results: Array<SearchResultDTO & { category: string }> = [];
        Object.entries(searchResults).forEach(([category, items]) => {
            items.forEach(item => {
                results.push({ ...item, category });
            });
        });
        return results;
    }, [searchResults]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Show dropdown when there are results
    useEffect(() => {
        setShowDropdown(flatResults.length > 0 && term.length > 0);
        setSelectedIndex(-1);
    }, [flatResults, term]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < flatResults.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && flatResults[selectedIndex]) {
                    handleSelectResult(flatResults[selectedIndex]);
                } else if (term.trim()) {
                    // Navigate to full search page
                    navigate(`/search?q=${encodeURIComponent(term)}`);
                    setShowDropdown(false);
                }
                break;
            case "Escape":
                setShowDropdown(false);
                setSelectedIndex(-1);
                break;
        }
    };

    const handleSelectResult = (result: SearchResultDTO & { category: string }) => {
        setShowDropdown(false);
        setTerm("");

        // Navigate to the appropriate detail page based on type
        const routeMap: Record<string, string> = {
            patients: "/patients",
            doctors: "/doctors",
            appointments: "/appointments",
            bills: "/bills",
            departments: "/departments",
            locations: "/locations",
        };

        const basePath = routeMap[result.category];
        if (basePath) {
            // For now, navigate to the list page with the search term
            // In a full implementation, you'd navigate to the detail page
            navigate(`${basePath}?highlight=${result.id}`);
        }
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            Patient: "bg-emerald-100 text-emerald-700",
            Doctor: "bg-blue-100 text-blue-700",
            Appointment: "bg-purple-100 text-purple-700",
            Bill: "bg-amber-100 text-amber-700",
            Department: "bg-rose-100 text-rose-700",
            Location: "bg-teal-100 text-teal-700",
        };
        return colors[type] || "bg-slate-100 text-slate-700";
    };

    const getTypeLabel = (type: string) => {
        const map: Record<string, Parameters<typeof t>[0]> = {
            Patient: "entity.patient",
            Doctor: "entity.doctor",
            Appointment: "entity.appointment",
            Bill: "entity.bill",
            Department: "entity.department",
            Location: "entity.location",
        };
        const key = map[type];
        return key ? t(key) : type;
    };

    const highlightMatch = (text: string, search: string) => {
        if (!search) return text;
        const parts = text.split(new RegExp(`(${search})`, 'gi'));
        return (
            <>
                {parts.map((part, i) =>
                    part.toLowerCase() === search.toLowerCase() ? (
                        <mark key={i} className="bg-yellow-200 text-slate-900 font-semibold">
                            {part}
                        </mark>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </>
        );
    };

    return (
        <div className="relative z-[9999]" ref={dropdownRef}>
            <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-300 px-3 py-2 shadow-sm hover:border-primary-400 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-200 transition-all">
                <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("search.placeholder")}
                    className="flex-1 outline-none bg-transparent text-sm placeholder-slate-400 min-w-[200px]"
                />
                {isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
                )}
                {term && !isLoading && (
                    <button
                        onClick={() => {
                            setTerm("");
                            setShowDropdown(false);
                            inputRef.current?.focus();
                        }}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Autocomplete Dropdown */}
            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl max-h-[400px] overflow-y-auto z-[9999]">
                    {flatResults.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">
                            {t("search.noResultsFor", { term })}
                        </div>
                    ) : (
                        <>
                            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                {flatResults.length === 1
                                    ? t("search.resultFound")
                                    : t("search.resultsFound", { count: flatResults.length })}
                            </div>
                            {flatResults.map((result, index) => (
                                <button
                                    key={`${result.category}-${result.id}`}
                                    onClick={() => handleSelectResult(result)}
                                    className={`w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-slate-100 last:border-b-0 ${index === selectedIndex ? "bg-primary-50" : ""
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTypeColor(result.type)}`}>
                                                {getTypeLabel(result.type)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-slate-900 text-sm truncate">
                                                {highlightMatch(result.label, term)}
                                            </div>
                                            <div className="text-xs text-slate-600 mt-0.5 truncate">
                                                {result.detail}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                {t("search.id")}: {result.id}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 text-slate-400">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </button>
                            ))}
                            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
                                <button
                                    onClick={() => {
                                        navigate(`/search?q=${encodeURIComponent(term)}`);
                                        setShowDropdown(false);
                                    }}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                                >
                                    {t("search.viewAll")}
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearchBarEnhanced;
