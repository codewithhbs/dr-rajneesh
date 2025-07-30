import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import axiosInstance from './axios';

const ProtectedRoute = ({ children }) => {
    const [auth, setAuth] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();

    // Define public routes that don't need authentication
    const publicRoutes = [
   
        '/admin/login',
        '/login',
        '/signup',
        '/register',
        '/forgot-password',
        '/reset-password',
     

    ];

    // Check if current route is public
    const isPublicRoute = publicRoutes.some(route => {
        if (route === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(route);
    });

    useEffect(() => {
        const checkAuthentication = async () => {
            // Skip auth check for public routes
            if (isPublicRoute) {
                console.log('🌐 Public route detected:', location.pathname);
                setAuth(true); // Allow access to public routes
                setIsLoading(false);
                return;
            }

            try {
                console.log('🔐 Checking authentication for protected route:', location.pathname);
                setIsLoading(true);
                setError(null);
                
                const response = await axiosInstance.get('/admin/check-auth');
                
                console.log('✅ Authentication successful:', response.data);
                setAuth(true);
                
            } catch (err) {
                console.error('❌ Authentication failed:', {
                    message: err.message,
                    status: err.response?.status,
                    statusText: err.response?.statusText,
                    data: err.response?.data,
                    url: err.config?.url,
                    currentPath: location.pathname
                });
                
                // Set specific error message based on error type
                if (err.response?.status === 401) {
                    setError('Session expired. Please login again.');
                    console.warn('⚠️ Session expired - redirecting to login');
                } else if (err.response?.status === 403) {
                    setError('Access denied. Insufficient permissions.');
                    console.warn('⚠️ Access denied - insufficient permissions');
                } else if (!err.response) {
                    setError('Network error. Please check your connection.');
                    console.error('🌐 Network error - no response received');
                } else {
                    setError(`Authentication error: ${err.response?.data?.message || 'Unknown error'}`);
                }
                
                setAuth(false);
                
            } finally {
                setIsLoading(false);
                console.log('🏁 Authentication check completed for:', location.pathname);
            }
        };

        checkAuthentication();
    }, [location.pathname, isPublicRoute]);

    // Loading state with better UI
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Verifying authentication...</p>
                    <p className="text-gray-400 text-sm mt-2">Please wait a moment</p>
                </div>
            </div>
        );
    }

    // If it's a public route, render children directly
    if (isPublicRoute) {
        console.log('✨ Rendering public route:', location.pathname);
        return children;
    }

    // For protected routes, check authentication
    if (!auth) {
        console.log('🔄 User not authenticated - redirecting to login from:', location.pathname);
        
        // Store the attempted URL for redirect after login
        const redirectPath = location.pathname + location.search;
        sessionStorage.setItem('redirectAfterLogin', redirectPath);
        
        return <Navigate to="/admin/login" replace />;
    }

    // Authenticated user accessing protected route
    console.log('✨ User authenticated - rendering protected content for:', location.pathname);
    return children;
};

export default ProtectedRoute;