import { API_URL } from '@/constant/Urls';
import axios from 'axios';
import React, { useEffect, useState } from 'react'

export const useSessionBookings = ({ id }) => {
    const [sessionDetails, setSessionDetails] = useState([]);
    const [singleSession, setSingleSession] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);       


    const fetchSessionDetails = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/admin-bookings`);
            if (response.data.success === false) {
                throw new Error(response.data.message || 'Failed to fetch session details');
            }
            console.log('Session details fetched successfully:', response.data.data);
            setSessionDetails(response.data.data);
        } catch (err) {
            console.error('Error fetching session details:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };


    const fetchSingleSessionDetails = async () => {
        try {
            const response = await axios.get(`${API_URL}/admin-bookings/${id}`);
            setSingleSession(response.data.data);
        } catch (err) {
            console.error('Error fetching session details:', err);
            setError(err);
        } finally {
           setTimeout(()=>{
             setLoading(false);
           },4500)
        }
    };


    useEffect(() => {
        fetchSessionDetails();

    }, []);
    useEffect(() => {
        if (id) {
            fetchSingleSessionDetails();
        }
    }, [id]);

    return { sessionDetails, loading, error, fetchSessionDetails, singleSession ,fetchSingleSessionDetails };
}

