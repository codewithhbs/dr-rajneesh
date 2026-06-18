"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { useSearchParams } from "next/navigation";

const API_BASE_URL = "https://api.drrajneeshkant.in/api/v1/full/user";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();

  const bookingId = searchParams.get("order_id");
  const merchant = searchParams.get("merchent");
  const payVia = searchParams.get("pay_via");

  const token = Cookies.get("token");

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bookingId || !token) {
      setError("Missing booking ID or authentication");
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/booking/${bookingId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setBooking(data?.data || data);
      } catch (err) {
        console.error("Booking fetch error:", err?.response?.data || err.message);
        setError("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, token]);

  if (loading) {
    return (
      <div className="mt-20 text-center text-lg">
        Loading booking details...
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="mt-20 text-center text-red-600 text-lg">
        {error || "Booking data not found"}
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateString));
  };

  return (
    <div className="max-w-4xl mx-auto mt-12 p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-green-600 mb-2">
          Payment Successful ✅
        </h1>
        <p className="text-gray-600">Your appointment has been confirmed</p>
      </div>

      <div className="bg-white shadow-xl rounded-2xl p-8">
        {/* Booking Summary */}
        <div className="border-b pb-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Booking Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500">Booking ID</p>
              <p className="font-medium">{booking.bookingId || bookingId}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-medium capitalize text-green-600">
                {booking.bookingStatus || "Confirmed"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Appointment Date</p>
              <p className="font-medium">
                {formatDate(booking.appointmentDate)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Appointment Time</p>
              <p className="font-medium">{booking.appointmentTime}</p>
            </div>
          </div>
        </div>

        {/* Service Details */}
        {booking.service && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-3">Service</h3>
            <div className="bg-gray-50 p-5 rounded-xl">
              <p className="text-lg font-medium">{booking.service.title}</p>
              <p className="text-gray-600 mt-1">{booking.service.desc}</p>
              {booking.service.tag && (
                <span className="inline-block mt-3 px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
                  {booking.service.tag}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Included Services */}
        {booking.selectedIncludedServices?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-3">Included Treatments</h3>
            <div className="space-y-3">
              {booking.selectedIncludedServices.map((service, index) => (
                <div
                  key={service._id || index}
                  className="flex gap-3 bg-gray-50 p-4 rounded-xl"
                >
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{service.title}</p>
                    <p className="text-sm text-gray-600">{service.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Clinic Details */}
        {booking.clinic && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">
              Clinic Details
            </h3>

            <div className="bg-gray-50 rounded-xl overflow-hidden border">
              {booking.clinic.clinic_images?.[0]?.url && (
                <img
                  src={booking.clinic.clinic_images[0].url}
                  alt={booking.clinic.clinic_name}
                  className="w-full h-64 object-cover"
                />
              )}

              <div className="p-5">
                <h4 className="text-lg font-bold">
                  {booking.clinic.clinic_name}
                </h4>

                {booking.clinic.any_special_note && (
                  <p className="text-gray-600 mt-2">
                    {booking.clinic.any_special_note}
                  </p>
                )}

                <div className="grid md:grid-cols-2 gap-4 mt-5">
                  <div>
                    <p className="text-sm text-gray-500">
                      Email
                    </p>
                    <p className="font-medium">
                      {booking.clinic.clinic_contact_details?.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Phone
                    </p>
                    <p className="font-medium">
                      {booking.clinic.clinic_contact_details?.phone_numbers?.join(
                        ", "
                      )}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">
                      Address
                    </p>
                    <p className="font-medium">
                      {
                        booking.clinic.clinic_contact_details
                          ?.clinic_address
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Clinic Timings
                    </p>
                    <p className="font-medium">
                      {
                        booking.clinic.clinic_timings
                          ?.open_time
                      }{" "}
                      -{" "}
                      {
                        booking.clinic.clinic_timings
                          ?.close_time
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Weekly Off
                    </p>
                    <p className="font-medium">
                      {
                        booking.clinic.clinic_timings
                          ?.off_day
                      }
                    </p>
                  </div>
                </div>

                {booking.clinic.clinic_map && (
                  <a
                    href={booking.clinic.clinic_map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Location
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Payment Details */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Payment Summary</h3>
          <div className="bg-gray-50 p-5 rounded-xl space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Original Amount</span>
              <span>₹{booking.service?.price || booking.amount}</span>
            </div>
            {booking.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>- ₹{booking.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-3">
              <span>Paid Amount</span>
              <span>₹{booking.paidAmount || booking.amount}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Payment Status</span>
              <span className="capitalize font-medium text-green-600">
                {booking.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          A confirmation email has been sent to your registered email address.
        </div>
      </div>
    </div>
  );
}