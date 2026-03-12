import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useService } from '@/hooks/use-service';
import { CheckCircle2 } from 'lucide-react'; // nicer icon than plain Check

const ServiceStep = () => {
  const { services } = useService();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedService, setSelectedService] = useState<string | null>(null);

  useEffect(() => {
    const serviceId = searchParams.get('service');
    if (serviceId) {
      setSelectedService(serviceId);
    }
  }, [searchParams]);

  const handleSelect = (serviceId: string) => {
    setSelectedService(serviceId);

    const params = new URLSearchParams(searchParams.toString());
    params.set('service', serviceId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const stripHtml = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  // Only show services that are meant to be displayed
  const visibleServices = services.filter(
    (service) => service.appointment_status === 'Show'
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2 text-center">
        Our Clinical Services
      </h2>
      <p className="text-lg text-gray-600 mb-10 text-center max-w-3xl mx-auto">
        Select the service that best matches your symptoms or treatment needs. We're here to help restore your mobility and comfort.
      </p>

      {visibleServices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No services available at the moment. Please check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {visibleServices.map((service) => {
            const isSelected = selectedService === service._id;
            const cleanDesc = stripHtml(service.service_desc).trim();

            return (
              <div
                key={service._id}
                onClick={() => handleSelect(service._id)}
                className={`
                  group relative bg-white rounded-2xl shadow-md overflow-hidden 
                  border-2 transition-all duration-300 ease-out
                  hover:shadow-xl hover:-translate-y-1 cursor-pointer
                  ${isSelected 
                    ? 'border-green-500 bg-green-50/40 shadow-green-100' 
                    : 'border-transparent hover:border-blue-200'
                  }
                `}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 z-10">
                    <CheckCircle2 className="w-8 h-8 text-green-600 fill-white stroke-[3]" />
                  </div>
                )}

                <div className="p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-4 group-hover:text-blue-700 transition-colors">
                    {service.service_name}
                  </h3>

                  <p className="text-gray-700 leading-relaxed text-base">
                    {cleanDesc.length > 220
                      ? cleanDesc.substring(0, 217) + '...'
                      : cleanDesc}
                  </p>

                  {/* Optional: subtle "Learn more" or selected label */}
                  <div className="mt-6">
                    {isSelected ? (
                      <span className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-full">
                        Selected ✓
                      </span>
                    ) : (
                      <span className="text-blue-600 text-sm font-medium group-hover:underline">
                        Select this service →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ServiceStep;