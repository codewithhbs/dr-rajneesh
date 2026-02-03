import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useService } from '@/hooks/use-service';
import { Check } from 'lucide-react';

const ServiceStep = () => {
    const { services } = useService();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [selectedService, setSelectedService] = useState(null);

    useEffect(() => {
        const serviceId = searchParams.get('service');
        if (serviceId) {
            setSelectedService(serviceId);
        }
    }, [searchParams]);

    const handleSelect = (serviceId) => {
        setSelectedService(serviceId);
                const params = new URLSearchParams(searchParams.toString());
        params.set('service', serviceId);
        router.push(`${pathname}?${params.toString()}`);
    };

    const removeHtmlTags = (htmlString) => {
        const div = document.createElement('div');
        div.innerHTML = htmlString;
        return div.textContent || div.innerText || '';
    };

    return (
        <div className="max-w-5xl mx-auto px-2 py-6">
            <h2 className="text-2xl font-semibold mb-4">Clinical Symptoms / Services</h2>
            <div className="flex justify-center flex-wrap gap-6">
                {services
                    .filter((service) => service.appointment_status === 'Show')
                    .map((service) => (
                        <div
                            key={service._id}
                            className={`relative p-4 border rounded-lg cursor-pointer transform transition duration-300 ease-in-out hover:scale-105 hover:shadow-lg ${
                                selectedService === service._id 
                                    ? 'bg-green-100 border-green-500' 
                                    : 'bg-amber-50 border-transparent'
                            }`}
                            onClick={() => handleSelect(service._id)}
                        >
                            {selectedService === service._id && (
                                <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                                    <Check className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <h2 className="text-xl font-bold text-blue-900 mb-2 pr-8">
                                {service.service_name}
                            </h2>
                            <p className="text-gray-700 text-sm">
                                {removeHtmlTags(service.service_desc)}
                            </p>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default ServiceStep;