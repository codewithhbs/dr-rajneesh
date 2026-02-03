"use client";

import React, { useState } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isToday } from "date-fns";
import Link from "next/link";

interface SessionDate {
  sessionNumber: number;
  date: string;
  time: string;
  status: string;
  _id: string;
}

interface PatientDetails {
  name: string;
  email: string;
  phone: string;
  aadhar: string;
}

interface Appointment {
  _id: string;
  bookingNumber: string;
  amountPerSession: number;
  progressPercentage: number;
  treatment_id?: { service_name: string };
  patient_details?: PatientDetails;
  session_booking_for_clinic?: { clinic_name: string };
  session_status: string;
  SessionDates: SessionDate[];
  completedSessionsCount?: number;
  no_of_session_book?: number;
}

interface AppointmentsCardProps {
  appointments?: Appointment[];
  type?: "appointments" | "history"; // 👈 view type
}

const ROWS_PER_PAGE = 5;

const AppointmentsCard: React.FC<AppointmentsCardProps> = ({
  appointments = [],
  type = "appointments",
}) => {
  const [page, setPage] = useState(1);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-700 border-green-300";
      case "Pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "Rescheduled":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "Cancelled":
        return "bg-red-100 text-red-700 border-red-300";
      case "Completed":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  // ✅ Build rows per booking (not per session)
  let rows = appointments.map((appointment) => {
    const completedCount = appointment.SessionDates.filter(
      (s) => s.status === "Completed",
    ).length;
    const cancelledCount = appointment.SessionDates.filter(
      (s) => s.status === "Cancelled",
    ).length;

    // Find next upcoming session
    const nextSession = appointment.SessionDates.find(
      (s) =>
        (s.status === "Pending" || s.status === "Confirmed") &&
        new Date(s.date) >= new Date(),
    );

    return {
      ...appointment,
      completedCount,
      cancelledCount,
      nextSession,
    };
  });

  // Filter based on type
  if (type === "appointments") {
    rows = rows.filter(
      (row) =>
        row.nextSession || row.session_status === "Payment Not Completed",
    );
  }

  if (type === "history") {
    rows = rows.filter((row) => row.completedCount > 0);
  }

  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE) || 1;
  const startIndex = (page - 1) * ROWS_PER_PAGE;
  const paginatedRows = rows.slice(startIndex, startIndex + ROWS_PER_PAGE);

  if (rows.length === 0) {
    return (
      <Card className="border border-blue-100 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
            <Calendar className="h-5 w-5 md:h-6 md:w-6" />
            {type === "appointments" ? "Appointments" : "Treatment History"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center text-gray-600">
          {type === "appointments"
            ? "No upcoming or pending appointments"
            : "No completed sessions in history"}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-blue-100 shadow-md hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
          <Calendar className="h-5 w-5 md:h-6 md:w-6" />
          {type === "appointments" ? "All Appointments" : "Treatment History"}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-blue-50 text-dark text-sm font-semibold sticky top-0 z-10 shadow-sm mt-5">
            <tr>
              <th className="px-4 py-3 border-b">Booking #</th>
              <th className="px-4 py-3 border-b">Patient</th>
              <th className="px-4 py-3 border-b">Service</th>
              <th className="px-4 py-3 border-b">Date/Time</th>
              <th className="px-4 py-3 border-b">Clinic</th>
              <th className="px-4 py-3 border-b">Amount</th>
              <th className="px-4 py-3 border-b">Progress</th>
              <th className="px-4 py-3 border-b">Next Session</th>
              <th className="px-4 py-3 border-b">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedRows.map((row) => (
              <>
                <Link href={`/pages/view-booking-details/${row?._id}`}>
                  <tr
                    key={row._id}
                    className="hover:bg-blue-50/50 transition-colors odd:bg-white even:bg-blue-50/20"
                  >
                    <td className="px-4 py-3 font-semibold text-xs text-gray-700 whitespace-nowrap">
                      {row.bookingNumber}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {row.patient_details?.name || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.patient_details?.phone} •{" "}
                        {row.patient_details?.email}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {row.treatment_id?.service_name || "-"}
                      <div className="text-xs text-gray-500">
                        {row.no_of_session_book}
                      </div>
                    </td>

                    {/* Date/Time (next session) */}
                    <td className="px-4 py-3">
                      {row.nextSession ? (
                        <div className="inline-flex items-center gap-3 whitespace-nowrap text-xs text-gray-700 font-semibold">
                          <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            <Calendar className="h-3 w-3" />
                            {format(
                              new Date(row.nextSession.date),
                              "MMM d, yyyy",
                            )}
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(
                                `1970-01-01T${row.nextSession.time}:00`,
                              ).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          No upcoming session
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-3 whitespace-nowrap text-xs text-gray-700 font-semibold">
                        <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          <MapPin className="h-3 w-3" />
                          {row.session_booking_for_clinic?.clinic_name ||
                            "Unknown Clinic"}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-700 font-medium">
                      ₹{row.amountPerSession.toLocaleString()}
                    </td>

                    {/* Progress */}
                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex flex-col gap-1">
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all duration-300 ${
                              row.completedCount === row.no_of_session_book
                                ? "bg-green-600"
                                : "bg-green-400"
                            }`}
                            style={{
                              width: `${
                                (row.completedCount / row.no_of_session_book) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {row.completedCount}/{row.no_of_session_book}{" "}
                          completed
                        </span>
                      </div>
                    </td>

                    {/* Next Session */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.nextSession ? (
                        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1 rounded text-xs font-semibold">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(
                              new Date(row.nextSession.date),
                              "MMM dd, yyyy",
                            )}
                          </span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>
                            {new Date(
                              `1970-01-01T${row.nextSession.time}:00`,
                            ).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                          {isToday(new Date(row.nextSession.date)) && (
                            <Badge variant="secondary" className="ml-2">
                              Today
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">
                          No upcoming session
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(
                          row.completedCount === row.no_of_session_book
                            ? "Completed"
                            : "Pending",
                        )} px-2 py-1 rounded text-xs`}
                      >
                        {row.completedCount} Completed
                        {row.cancelledCount > 0 &&
                          ` / ${row.cancelledCount} Cancelled`}
                      </Badge>
                    </td>
                  </tr>
                </Link>
              </>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-end items-center px-4 py-3 border-t bg-gray-50 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Prev
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <Button
                key={pageNum}
                size="sm"
                variant={page === pageNum ? "default" : "outline"}
                className={
                  page === pageNum
                    ? "bg-blue-600 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </Button>
            ),
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentsCard;
