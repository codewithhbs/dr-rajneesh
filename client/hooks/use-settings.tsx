import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_ENDPOINT } from '@/constant/url';

// Define a proper interface for the settings data
interface SettingsData {
    contact_details?: {
        phone_number?: string;
        support_email?: string;
    };
   
    [key: string]: unknown;
}

interface UseSettingsResult {
    settings: SettingsData | null;  
    loading: boolean;
    error: string | null;
}

export function useSettings(): UseSettingsResult {
    const [settings, setSettings] = useState<SettingsData | null>(null);  // Fixed: Proper typing
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        
        axios
            .get(`${API_ENDPOINT}/get-setting`)
            .then((response) => {
                if (isMounted) {
                    setSettings(response.data?.data);
                    setError(null);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    // Fixed: Better error handling
                    const errorMessage = err.response?.data?.message || 
                                       err.message || 
                                       'Failed to fetch settings';
                    setError(errorMessage);
                    setSettings(null);
                }
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return { settings, loading, error };
}