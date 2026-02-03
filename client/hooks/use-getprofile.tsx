"use clinet"
import { useState, useCallback, useEffect } from 'react';
import axios, { isAxiosError } from 'axios';
import { API_ENDPOINT } from '@/constant/url';
import Cookies from "js-cookie";


interface ProfileData {
    name: string;
    email: string;
    phone: string;
    profileImage: null;
    isGoogleAuth: boolean;
    status: string;
    role: string;
    createdAt: string;
}

export const useGetProfile = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ProfileData | null>(null);

    const getProfile = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const cookieToken = Cookies.get("token");
            if (!cookieToken) {
                // throw new Error("No authentication token found");
                setError("No authentication token found");
                setLoading(false);
                return;
            }

            const response = await axios.get<ProfileData>(
                `${API_ENDPOINT}/user/profile`,
                {
                    headers: {
                        Authorization: `Bearer ${cookieToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            setData(response.data.data);
            return response.data.data

        } catch (err) {
            console.error("Error fetching profile:", err);
            if (isAxiosError(err)) {
                setError(err?.response?.data?.message || "Failed to fetch profile");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(()=>{
        getProfile()
    },[])
    return { loading, error, data, getProfile };
}