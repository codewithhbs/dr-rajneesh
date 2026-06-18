"use client";

import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:7900/api/v1/full/user";

const TIME_SLOTS = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM",
];

function toISODate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function buildCalendarDays(monthDate: Date) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
}

const SpinnerIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
        <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
);

export default function DateTimeStep({ token, formData, setFormData, onNext, onBack }: any) {
    const today = useMemo(() => new Date(), []);
    const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [checking, setChecking] = useState(false);
    const [slotError, setSlotError] = useState("");
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [dateBlocked, setDateBlocked] = useState(false);

    const selectedDate: Date | null = formData.appointmentDate
        ? new Date(formData.appointmentDate)
        : null;

    const calendarDays = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);
    console.log(token)
    // Whenever a date is picked, re-check availability for that date
    useEffect(() => {
        if (!selectedDate || !formData.serviceId) return;
        checkDateAvailability(selectedDate);
    }, [formData.appointmentDate, formData.serviceId]);

    async function checkDateAvailability(date: Date) {
        setChecking(true);
        setSlotError("");
        setDateBlocked(false);

        try {
const res = await fetch(`${API_BASE_URL}/check-slot`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    serviceId: formData.serviceId,
    appointmentDate: toISODate(date),
  }),
});
            const data = await res.json();

            if (data.success && !data.available) {
                if (data.reason === "DATE_BLOCKED") {
                    setDateBlocked(true);
                    setSlotError("This date is not available for booking. Please choose another date.");
                } else if (data.reason === "DAY_LIMIT_REACHED") {
                    setSlotError("Booking limit reached for this date. Please choose another date.");
                }
            }
        } catch {
            setSlotError("Could not verify date availability. Please try again.");
        } finally {
            setChecking(false);
        }
    }

    async function selectTime(time: string) {
        if (!selectedDate) return;
        setChecking(true);
        setSlotError("");

        try {
            const res = await fetch(`${API_BASE_URL}/check-slot`, {
                method: "POST",
        headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
                body: JSON.stringify({
                    serviceId: formData.serviceId,
                    appointmentDate: toISODate(selectedDate),
                    appointmentTime: time,
                }),
            });
            const data = await res.json();

            if (data.success && data.available) {
                setFormData((prev: any) => ({ ...prev, appointmentTime: time }));
            } else {
                setBookedSlots((prev) => [...prev, time]);
                setSlotError("That time slot was just taken. Please pick another.");
            }
        } catch {
            setSlotError("Could not verify slot. Please try again.");
        } finally {
            setChecking(false);
        }
    }

    function pickDate(d: Date) {
        if (d < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return;
        setBookedSlots([]);
        setFormData((prev: any) => ({
            ...prev,
            appointmentDate: toISODate(d),
            appointmentTime: "",
        }));
    }

    const canContinue =
        !!formData.appointmentDate && !!formData.appointmentTime && !dateBlocked;

    const monthLabel = viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div style={styles.avatar}>RK</div>
                <div>
                    <h2 style={styles.title}>Pick a date & time</h2>
                    <p style={styles.subtitle}>{formData.serviceTitle || "Selected treatment"}</p>
                </div>
            </div>

            <div style={styles.calendarCard}>
                <div style={styles.calendarHeader}>
                    <button
                        style={styles.navBtn}
                        onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                    >
                        ‹
                    </button>
                    <span style={styles.monthLabel}>{monthLabel}</span>
                    <button
                        style={styles.navBtn}
                        onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                    >
                        ›
                    </button>
                </div>

                <div style={styles.weekRow}>
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                        <span key={i} style={styles.weekLabel}>{d}</span>
                    ))}
                </div>

                <div style={styles.daysGrid}>
                    {calendarDays.map((d, i) => {
                        if (!d) return <span key={i} />;
                        const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const isSelected = selectedDate && toISODate(d) === toISODate(selectedDate);

                        return (
                            <button
                                key={i}
                                disabled={isPast}
                                onClick={() => pickDate(d)}
                                style={{
                                    ...styles.dayCell,
                                    background: isSelected ? "#185FA5" : "transparent",
                                    color: isPast ? "#C7C5BC" : isSelected ? "#fff" : "#2C2C2A",
                                    cursor: isPast ? "not-allowed" : "pointer",
                                }}
                            >
                                {d.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedDate && (
                <div style={styles.slotsSection}>
                    <p style={styles.slotsTitle}>Available time slots</p>

                    {checking && (
                        <div style={styles.checkingRow}>
                            <SpinnerIcon /> <span>Checking availability…</span>
                        </div>
                    )}

                    {!dateBlocked && (
                        <div style={styles.slotsGrid}>
                            {TIME_SLOTS.map((time) => {
                                const taken = bookedSlots.includes(time);
                                const selected = formData.appointmentTime === time;
                                return (
                                    <button
                                        key={time}
                                        disabled={taken || checking}
                                        onClick={() => selectTime(time)}
                                        style={{
                                            ...styles.slotBtn,
                                            borderColor: selected ? "#185FA5" : taken ? "#E8E6DD" : "#D3D1C7",
                                            background: selected ? "#185FA5" : taken ? "#F1EFE8" : "#fff",
                                            color: selected ? "#fff" : taken ? "#B4B2A9" : "#2C2C2A",
                                            textDecoration: taken ? "line-through" : "none",
                                            cursor: taken ? "not-allowed" : "pointer",
                                        }}
                                    >
                                        {time}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {slotError && <p style={styles.slotError}>{slotError}</p>}
                </div>
            )}

            <div style={styles.footer}>
                <button onClick={onBack} style={styles.backBtn}>Back</button>
                <button
                    onClick={onNext}
                    disabled={!canContinue}
                    style={{ ...styles.primaryBtnWide, opacity: canContinue ? 1 : 0.5 }}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}

const styles: any = {
    page: { fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: 940, margin: "0 auto", padding: "32px 20px", color: "#2C2C2A" },
    header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 28 },
    avatar: { width: 48, height: 48, borderRadius: "50%", background: "#E6F1FB", color: "#185FA5", fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" },
    title: { fontSize: 22, fontWeight: 600, margin: 0 },
    subtitle: { fontSize: 13, color: "#888780", margin: "3px 0 0" },

    calendarCard: { border: "1.5px solid #D3D1C7", borderRadius: 14, padding: "18px 20px", marginBottom: 24, maxWidth: 360 },
    calendarHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    navBtn: { width: 32, height: 32, borderRadius: 8, border: "1px solid #D3D1C7", background: "#fff", fontSize: 16, cursor: "pointer" },
    monthLabel: { fontSize: 14, fontWeight: 600 },
    weekRow: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 },
    weekLabel: { textAlign: "center", fontSize: 11, color: "#888780", fontWeight: 600 },
    daysGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 },
    dayCell: { height: 34, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500 },

    slotsSection: { marginBottom: 28 },
    slotsTitle: { fontSize: 13, fontWeight: 600, color: "#444441", margin: "0 0 12px" },
    checkingRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#185FA5", marginBottom: 12 },
    slotsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, maxWidth: 480 },
    slotBtn: { height: 42, border: "1.5px solid", borderRadius: 8, fontSize: 13.5, fontWeight: 500 },
    slotError: { fontSize: 13, color: "#A32D2D", marginTop: 12 },

    footer: { display: "flex", justifyContent: "space-between", marginTop: 8 },
    backBtn: { height: 48, padding: "0 24px", background: "transparent", color: "#5F5E5A", border: "1.5px solid #D3D1C7", borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: "pointer" },
    primaryBtnWide: { height: 48, padding: "0 32px", background: "#185FA5", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" },
};