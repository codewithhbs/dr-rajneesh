import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_ENDPOINT } from '@/constant/url';

interface UseSettingsResult {
    loading: boolean;
    error: string | null;
}

export function useSettings(): UseSettingsResult {
    const [settings, setSettings] = useState<null>(null);
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
                    setError(err.response.data?.message || 'Failed to fetch settings');
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