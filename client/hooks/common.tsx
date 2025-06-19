import { API_ENDPOINT } from '@/constant/url';
import axios from 'axios';
import { useState, useEffect } from 'react';

export const useGetAllDoctor = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get(`${API_ENDPOINT}/get-all-doctor`)
            .then((res) => {
                setData(res.data.data);
            })
            .catch((error) => {
                console.error('Error fetching doctors:', error);
                setData([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return { data, loading };
};

export const useGetAllClinic = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get(`${API_ENDPOINT}/get-all-clinic`)
            .then((res) => {
                setData(res.data.data?.clinics);
            })
            .catch((error) => {
                console.error('Error fetching clinics:', error);
                setData([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return { data, loading };
};
