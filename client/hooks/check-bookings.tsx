import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_ENDPOINT } from '@/constant/url';
import { useAuth } from '@/context/authContext/auth';
import Cookies from "js-cookie";

interface BookingCheckParams {
    date: string;
    time: string;
    service_id: string;
    clinic_id: string
}

interface BookingAvailabilityResponse {
    success: boolean;
    available: boolean;
    bookedCount: number;
    limit: number;
    specialSlotApplied: boolean;
}

export function useCheckBookings({ date, time, service_id, clinic_id }: BookingCheckParams) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<BookingAvailabilityResponse | null>(null);
    const { token } = useAuth()
    console.log("I am start", date,
        time,
        service_id,
        clinic_id);
    const checkAvailability = useCallback(async () => {
        const cookieToken = Cookies.get("token");


        setLoading(true);
        setError(null);

        try {
            const response = await axios.post<BookingAvailabilityResponse>(
                `${API_ENDPOINT}/user/bookings/availability`,
                {
                    date,
                    time,
                    service_id,
                    clinic_id
                },
                {
                    headers: {
                        Authorization: `Bearer ${cookieToken}`,
                        'Content-Type': 'application/json', // Optional, but good practice
                    },
                }
            );

            console.log("availabilityData", response.data);
            setData(response.data);
            return response.data;

        } catch (err: any) {
            console.log("err?.response?.data?.message", err)
            setError(err?.response?.data?.message || 'Error checking availability');
            setData(null);
            return null;

        } finally {
            setLoading(false);
        }

    }, [date, time, service_id, clinic_id]);

    return { checkAvailability, data, loading, error };
}
