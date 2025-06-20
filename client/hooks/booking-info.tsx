import { API_ENDPOINT } from "@/constant/url";
import axios from "axios";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export const useGetBookingById = ({ id }: { id: string }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBooking = async () => {
            const cookieToken = Cookies.get("token");
            setLoading(true);
            setData(null);
            setError(null);

            try {
                const response = await axios.get(`${API_ENDPOINT}/user/found-booking/${id}`, {
                    headers: {
                        Authorization: `Bearer ${cookieToken}`,
                    },
                });

                console.log("📦 Booking data:", response.data.data);

                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    setData(null);
                    setError("Booking not found.");
                }
            } catch (err: any) {
                console.error("❌ Error fetching booking:", err);
                setError(err?.response?.data?.message || "Order Not Found");
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBooking();
        }
    }, [id]);

    return { data, loading, error };
};
