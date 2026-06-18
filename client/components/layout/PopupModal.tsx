"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_ENDPOINT = "https://api.drrajneeshkant.in/api/v1";

export default function PopupModal() {
    const [popup, setPopup] = useState(null);
    const [open, setOpen] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        checkPopup();
    }, []);

    const isWithinSchedule = (data) => {
        const now = Date.now();

        if (data.startAt && now < new Date(data.startAt).getTime()) return false;
        if (data.endAt && now > new Date(data.endAt).getTime()) return false;

        return true;
    };

    const checkPopup = async () => {
        try {
            const lastClosed = localStorage.getItem("popup_closed_at");

            if (lastClosed) {
                const diff = Date.now() - Number(lastClosed);

                // 30 seconds
                if (diff < 30000) return;
            }

            const { data } = await axios.get(`${API_ENDPOINT}/popup/active`);

            if (data?.success && data?.data && isWithinSchedule(data.data)) {
                setPopup(data.data);
                setOpen(true);
            }
        } catch (err) {
            console.log(err);
        }
    };

    const closePopup = () => {
        setClosing(true);
        localStorage.setItem("popup_closed_at", Date.now().toString());

        setTimeout(() => {
            setOpen(false);
            setClosing(false);
        }, 180);
    };

    if (!open || !popup) return null;

    const formattedDate = popup.availableDate
        ? new Date(popup.availableDate).toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
        })
        : null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${closing ? "opacity-0" : "opacity-100"
                }`}
            style={{ background: "rgba(13, 27, 26, 0.72)" }}
        >
            <div
                className={`relative w-full max-w-xl overflow-hidden rounded-[28px] bg-[#FBF8F2] shadow-2xl transition-all duration-200 ${closing ? "scale-95 opacity-0" : "scale-100 opacity-100"
                    }`}
            >
                {/* Close button */}
                <button
                    onClick={closePopup}
                    aria-label="Close"
                    className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#0D1B1A]/70 text-[#FBF8F2] backdrop-blur-sm transition hover:bg-[#0D1B1A]"
                >
                    ✕
                </button>

                {/* Image */}
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3" }}>
                    <img
                        src={popup.image}
                        alt={popup.title}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B1A]/80 via-transparent to-transparent" />

                    {popup.priority === 1 && (
                        <span className="absolute top-4 left-4 rounded-full bg-[#C9952B] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0D1B1A]">
                            Featured
                        </span>
                    )}

                    <h2 className="absolute bottom-4 left-5 right-5 font-serif text-2xl font-bold leading-tight text-white">
                        {popup.title}
                    </h2>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <p className="text-[15px] leading-relaxed text-[#3F4A49]">
                        {popup.description}
                    </p>

                    {(popup.doctorName || popup.location) && (
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#0D1B1A]">
                            {popup.doctorName && (
                                <span className="font-medium">{popup.doctorName}</span>
                            )}
                            {popup.location && (
                                <span className="text-[#3F4A49]">📍 {popup.location}</span>
                            )}
                        </div>
                    )}

                    {(formattedDate || popup.availableTime) && (
                        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#E4DCC8] bg-[#F4EFE2] px-4 py-3">
                            {formattedDate && (
                                <div className="flex flex-col items-center border-r border-[#E4DCC8] pr-3">
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9C8350]">
                                        Date
                                    </span>
                                    <span className="text-sm font-semibold text-[#0D1B1A]">
                                        {formattedDate}
                                    </span>
                                </div>
                            )}
                            {popup.availableTime && (
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9C8350]">
                                        Time
                                    </span>
                                    <span className="text-sm font-semibold text-[#0D1B1A]">
                                        {popup.availableTime}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {popup.button?.text && popup.button?.link && (
                        <a
                            href={popup.button.link}
                            target={popup.button.openInNewTab ? "_blank" : "_self"}
                            rel="noreferrer"
                            className="mt-5 block rounded-2xl bg-[#0D1B1A] py-3.5 text-center text-[15px] font-semibold text-[#FBF8F2] transition hover:bg-[#16302E]"
                        >
                            {popup.button.text}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}