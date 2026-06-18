"use client";

import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:7900/api/v1/full/user";

/* ─── Icons ─── */
const CheckIcon = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M2.5 7L5.5 10L11.5 4" />
    </svg>
);

const SpinnerIcon = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 16 16"
        fill="none"
        className="animate-spin"
    >
        <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.3"
        />
        <path
            d="M14 8a6 6 0 00-6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);

interface IncludedServicesStepProps {
    formData: any;
    token: string;
    setFormData: (updater: any) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function IncludedServicesStep({
    formData,
    token,
    setFormData,
    onNext,
    onBack,
}: IncludedServicesStepProps) {
    const [selected, setSelected] = useState<string[]>(
        formData.selectedIncludedServices || []
    );
    const [includedServices, setIncludedServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const serviceId = formData.serviceId;

    useEffect(() => {
        fetchServiceDetails();
    }, [serviceId]);

    async function fetchServiceDetails() {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await res.json();
            if (data.success) {
                const service = data.data || data;
                const servicesList = service.included_services || [];
                setIncludedServices(servicesList);
                setFormData((prev: any) => ({
                    ...prev,
                    includedServicesData: servicesList,
                    serviceTitle: service.title || prev.serviceTitle,
                }));
            } else {
                setError(data.message || "Failed to load service details");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setSelected(formData.selectedIncludedServices || []);
    }, [formData.selectedIncludedServices]);

    const toggleService = (id: string) => {
        const newSelected = selected.includes(id)
            ? selected.filter((s) => s !== id)
            : [...selected, id];
        setSelected(newSelected);
        setFormData((prev: any) => ({
            ...prev,
            selectedIncludedServices: newSelected,
        }));
    };

    return (
        <div className="font-sans max-w-[940px] mx-auto px-4 py-6 sm:px-5 sm:py-8 text-[#2C2C2A]">

            {/* ── Header ── */}
            <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#E6F1FB] text-[#185FA5] font-semibold text-sm sm:text-[15px] flex items-center justify-center shrink-0">
                    RK
                </div>
                <div>
                    <h2 className="text-lg sm:text-[22px] font-semibold m-0 leading-tight">
                        Customize your treatment
                    </h2>
                    <p className="text-xs sm:text-[14px] text-[#555] mt-1 m-0 leading-snug">
                        {formData.serviceTitle} — Select what you want included
                    </p>
                </div>
            </div>

            {/* ── Info Banner ── */}
            <div className="bg-[#F8F4E9] border border-[#EDE4C9] rounded-xl px-4 py-3.5 text-[12.5px] sm:text-[13.5px] text-[#6B5F3F] mb-6 sm:mb-7 leading-relaxed">
                <strong>Note:</strong> Price remains fixed. This selection is only for your reference and will be shared with the doctor.
            </div>

            {/* ── Loading ── */}
            {loading && (
                <div className="flex items-center justify-center gap-2.5 py-14 text-[#185FA5] text-sm sm:text-[15px]">
                    <SpinnerIcon />
                    <span>Loading included services…</span>
                </div>
            )}

            {/* ── Error ── */}
            {!loading && error && (
                <div className="flex items-center justify-between bg-[#FBEAEA] border border-[#E24B4A]/40 rounded-xl px-4 py-3.5 text-[13px] text-[#A32D2D] mb-5">
                    <span>{error}</span>
                    <button
                        onClick={fetchServiceDetails}
                        className="ml-3 shrink-0 bg-[#A32D2D] text-white border-none rounded-md px-3.5 py-1.5 text-xs cursor-pointer hover:bg-[#8a2626] transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* ── Services Grid ── */}
            {!loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10">
                    {includedServices.length > 0 ? (
                        includedServices.map((item: any) => {
                            const id = item._id || item.id;
                            const isChecked = selected.includes(id);

                            return (
                                <button
                                    key={id}
                                    onClick={() => toggleService(id)}
                                    className={[
                                        "flex items-start gap-3 sm:gap-3.5 p-4 sm:p-[18px] border-[1.5px] rounded-xl cursor-pointer text-left transition-all duration-150 min-h-[90px] sm:min-h-[110px] w-full font-sans",
                                        isChecked
                                            ? "bg-[#EAF1FA] border-[#185FA5]"
                                            : "bg-white border-[#D3D1C7] hover:border-[#185FA5]/50 hover:bg-[#F5F9FE]",
                                    ].join(" ")}
                                >
                                    {/* Checkbox */}
                                    <div
                                        className={[
                                            "w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] border-2 border-[#185FA5] rounded-[5px] sm:rounded-[6px] flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                            isChecked ? "bg-[#185FA5] text-white" : "bg-white text-transparent",
                                        ].join(" ")}
                                    >
                                        <CheckIcon />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-[14px] sm:text-[15.5px] leading-snug">
                                            {item.title}
                                        </div>
                                        {item.desc && (
                                            <div className="text-[12px] sm:text-[13px] text-[#666] mt-1.5 leading-[1.45]">
                                                {item.desc}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="col-span-full text-center py-16 sm:py-20 text-[#888780] text-sm sm:text-[15px]">
                            No additional services available for this treatment.
                        </div>
                    )}
                </div>
            )}

            {/* ── Footer ── */}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-4">
                <button
                    onClick={onBack}
                    className="h-11 sm:h-12 px-6 sm:px-7 bg-transparent text-[#555] border-[1.5px] border-[#D3D1C7] rounded-lg text-[14px] sm:text-[15px] cursor-pointer hover:border-[#999] hover:text-[#333] transition-colors w-full sm:w-auto"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="h-11 sm:h-12 px-7 sm:px-9 bg-[#185FA5] text-white border-none rounded-lg text-[14px] sm:text-[15px] font-semibold cursor-pointer hover:bg-[#154f8a] active:bg-[#123f6e] transition-colors w-full sm:w-auto"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}