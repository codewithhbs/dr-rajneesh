"use client"
export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Phone, Mail, Clock, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettings } from '@/hooks/use-settings';

interface PageProps {
    searchParams: Promise<{
        reason?: string;
        [key: string]: string | undefined;
    }>;
}

const Page: React.FC<PageProps> = ({ searchParams }) => {
    const [reason, setReason] = useState<string>('Unknown error occurred');
    const { settings } = useSettings();

    useEffect(() => {
        const getSearchParams = async () => {
            const params = await searchParams;
            setReason(params?.reason || 'Unknown error occurred');
        };
        getSearchParams();
    }, [searchParams]);
    const handleRetry = () => {

        window.history.back();
    };

    const handleContactSupport = () => {
       
        window.location.href =  `mailto:${settings?.contact_details?.support_email}`;
    };

    return (
         <Suspense fallback={<div>Loading...</div>}>

         </Suspense>
    
    );
};

export default Page;