import axiosInstance from "@/lib/axios";
import { useEffect, useState, useCallback } from "react";

const useBlogCategories = () => {
    const [categories, setCategories] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCategories = useCallback(() => {
        setLoading(true);
        axiosInstance
            .get(`/all-categories`)
            .then((response) => {
                setCategories(response.data.data);
                setError(null);
            })
            .catch((err) => {
                setError(err);
                setCategories(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);



    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return { categories, loading, error, refetch: fetchCategories };
};

export default useBlogCategories;
