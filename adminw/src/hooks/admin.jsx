import axiosInstance from "@/lib/axios";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const useAdminProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate()

    const fetchProfile = useCallback(() => {
        setLoading(true);
        axiosInstance
            .get(`/admin/profile`)
            .then((response) => {
                setProfile(response.data.data);
                setError(null);
            })
            .catch((err) => {
                setError(err);
                setProfile(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);


    const handleLogout = async () => {
        try {
            console.log('🚪 Logging out admin...')
            const response = await axiosInstance.get('/admin/logout')
            console.log('✅ Logout successful:', response.data)

            toast.success('Logged out successfully!')


            localStorage.removeItem('adminToken')
            sessionStorage.removeItem('adminToken')


            navigate('/admin/login', { replace: true })

        } catch (error) {
            console.error('❌ Logout failed:', error)
            toast.error(error.response?.data?.message || 'Logout failed')
        }
    }

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, loading, error, refetch: fetchProfile ,handleLogout };
};

export default useAdminProfile;
