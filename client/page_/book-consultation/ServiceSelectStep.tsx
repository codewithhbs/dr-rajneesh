"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";

const API_BASE_URL = "https://api.drrajneeshkant.in/api/v1/full/user";

/* ─── Icons ─── */
const CheckIcon = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M2.5 7L5.5 10L11.5 4" />
    </svg>
);

const SpinnerIcon = () => (
    <svg
        width="20"
        height="20"
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

export default function ServiceSelectStep({ formData, setFormData, onNext }: any) {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const cookieToken = Cookies.get("token");

    useEffect(() => {
        fetchServices();
    }, []);

    async function fetchServices() {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE_URL}/services`, {
                headers: {
                    Authorization: `Bearer ${cookieToken}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await res.json();
            if (data.success) {
                setServices(data.data || []);
            } else {
                setError(data.message || "Failed to load services");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    function selectService(service: any) {
        setFormData((prev: any) => ({
            ...prev,
            serviceId: service._id,
            serviceTitle: service.title,
            servicePrice: service.price,
            serviceDiscountPrice: service.discount_price,
            includedServicesData: service.included_services || [],
            selectedIncludedServices: [],
        }));
    }

    const canContinue = !!formData.serviceId;

    return (
        <div className="font-sans max-w-[940px] mx-auto px-4 py-6 sm:px-5 sm:py-8 text-[#2C2C2A]">

            {/* ── Header ── */}
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-7">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#E6F1FB] text-[#185FA5] font-semibold text-sm sm:text-[15px] flex items-center justify-center shrink-0">
                    RK
                </div>
                <div>
                    <h2 className="text-lg sm:text-[22px] font-semibold m-0 leading-tight">
                        Choose a treatment
                    </h2>
                    <p className="text-xs sm:text-[13px] text-[#888780] mt-0.5 m-0">
                        Dr. Rajneesh Kant · Back to Nature Spine Clinic
                    </p>
                </div>
            </div>

            {/* ── Loading ── */}
            {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-[#185FA5] py-10">
                    <SpinnerIcon />
                    <span>Loading available treatments…</span>
                </div>
            )}

            {/* ── Error ── */}
            {!loading && error && (
                <div className="flex items-center justify-between bg-[#FBEAEA] border border-[#E24B4A]/40 rounded-xl px-4 py-3.5 text-[13px] text-[#A32D2D] mb-5">
                    <span>{error}</span>
                    <button
                        onClick={fetchServices}
                        className="ml-3 shrink-0 bg-[#A32D2D] text-white border-none rounded-md px-3 py-1.5 text-xs cursor-pointer hover:bg-[#8a2626] transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* ── Empty ── */}
            {!loading && !error && services.length === 0 && (
                <div className="text-center py-12 text-[#888780] text-sm">
                    No treatments are available for booking right now.
                </div>
            )}

            {/* ── Service Grid ── */}
            {!loading && !error && services.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-7">
                    {services.map((svc) => {
                        const selected = formData.serviceId === svc._id;
                        const hasDiscount =
                            svc.discount_price > 0 && svc.discount_price < svc.price;

                        return (
                            <button
                                key={svc._id}
                                onClick={() => selectService(svc)}
                                className={[
                                    "relative text-left rounded-2xl p-4 sm:p-5 cursor-pointer flex flex-col gap-2 font-sans w-full transition-all duration-150",
                                    "border-[1.5px]",
                                    selected
                                        ? "border-[#185FA5] bg-[#EAF1FA]"
                                        : "border-[#D3D1C7] bg-white hover:border-[#185FA5]/50 hover:bg-[#F5F9FE]",
                                ].join(" ")}
                            >
                                {/* Tag */}
                                {svc.tag && (
                                    <span className="self-start bg-[#FFF3D6] text-[#8A5A00] text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-1">
                                        {svc.tag}
                                    </span>
                                )}

                                {/* Selected checkmark */}
                                {selected && (
                                    <span className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-[22px] h-[22px] rounded-full bg-[#639922] text-white flex items-center justify-center">
                                        <CheckIcon />
                                    </span>
                                )}

                                {/* Title */}
                                <h3 className="text-[15px] sm:text-base font-semibold m-0 pr-7">
                                    {svc.title}
                                </h3>

                                {/* Description */}
                                {svc.desc && (
                                    <p className="text-[12.5px] sm:text-[13px] text-[#5F5E5A] m-0 leading-[1.45]">
                                        {svc.desc}
                                    </p>
                                )}

                                {/* Price */}
                                <div className="flex items-baseline gap-2 mt-1">
                                    {hasDiscount ? (
                                        <>
                                            <span className="text-lg sm:text-[19px] font-bold text-[#185FA5]">
                                                ₹{svc.discount_price}
                                            </span>
                                            <span className="text-[12px] sm:text-[13px] text-[#A8A6A0] line-through">
                                                ₹{svc.price}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-lg sm:text-[19px] font-bold text-[#185FA5]">
                                            ₹{svc.price}
                                        </span>
                                    )}
                                </div>

                                {/* Included services */}
                                {svc.included_services?.filter((s: any) => s.is_active).length > 0 && (
                                    <ul className="list-none p-0 m-0 mt-1.5 flex flex-col gap-1">
                                        {svc.included_services
                                            .filter((s: any) => s.is_active)
                                            .slice(0, 3)
                                            .map((item: any, i: number) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center gap-1.5 text-[12px] sm:text-[12.5px] text-[#444441]"
                                                >
                                                    <CheckIcon /> {item.title}
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Footer ── */}
            <div className="flex justify-end">
                <button
                    onClick={onNext}
                    disabled={!canContinue}
                    className={[
                        "h-11 sm:h-12 px-7 sm:px-8 bg-[#185FA5] text-white border-none rounded-lg text-[14px] sm:text-[15px] font-semibold cursor-pointer transition-opacity",
                        "w-full sm:w-auto",
                        canContinue
                            ? "opacity-100 hover:bg-[#154f8a] active:bg-[#123f6e]"
                            : "opacity-50 cursor-not-allowed",
                    ].join(" ")}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}