import axios from "axios";
export const API_URL = "https://drkm.api.adsdigitalmedia.com/api/v1";

export const fetcher = async (url) => {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
};



export const  statusOptions = ['Pending', 'Confirmed', 'Payment Not Completed', 'Cancelled', 'Completed', 'Rescheduled', 'Partially Completed'];
export const statusOptionsSession = [
  'Pending',
  'Confirmed', 
  'Cancelled',
  'Completed',
  'Rescheduled',
  'No-Show'
];

export const prescriptionTypes = [
  'Pre-Treatment',
  'Post-Treatment', 
  'Follow-up',
  'Emergency'
];