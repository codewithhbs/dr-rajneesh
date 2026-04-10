"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useService } from '@/hooks/use-service';
import { CheckCircle2, ArrowRight } from 'lucide-react';

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

  const visibleServices = services.filter(
    (service) => service.appointment_status === 'Show'
  );

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#F8F7F4", 
      padding: "40px 16px", 
      fontFamily: "system-ui, -apple-system, sans-serif" 
    }}>
      <div style={{ maxWidth: 1020, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <div style={{ 
            display: "inline-block", 
            background: "#E6F1FB", 
            color: "#185FA5", 
            fontSize: 12, 
            fontWeight: 500, 
            borderRadius: 20, 
            padding: "4px 14px", 
            marginBottom: 12, 
            border: "0.5px solid #85B7EB" 
          }}>
            Clinical Services
          </div>
          
          <h2 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: "#2C2C2A", 
            margin: "0 0 12px 0",
            lineHeight: 1.2
          }}>
            Choose Your Treatment
          </h2>
          
          <p style={{ 
            color: "#5F5E5A", 
            fontSize: 15, 
            maxWidth: 520, 
            margin: "0 auto" 
          }}>
            Select the service that best addresses your condition. 
            Expert care by Dr. Rajneesh Kant.
          </p>
        </div>

        {visibleServices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p style={{ color: "#B4B2A9", fontSize: 16 }}>
              No services available at the moment.
            </p>
          </div>
        ) : (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", 
            gap: 24 
          }}>
            {visibleServices.map((service) => {
              const isSelected = selectedService === service._id;
              const cleanDesc = stripHtml(service.service_desc || service.service_small_desc || '').trim();

              return (
                <div
                  key={service._id}
                  onClick={() => handleSelect(service._id)}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    border: isSelected ? "2px solid #185FA5" : "0.5px solid #D3D1C7",
                    padding: "28px 32px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                    height: "100%",
                  }}
                  className="hover:shadow-md group"
                >
                  {/* Selected Indicator */}
                  {isSelected && (
                    <div style={{ 
                      position: "absolute", 
                      top: 20, 
                      right: 20 
                    }}>
                      <CheckCircle2 size={28} style={{ color: "#185FA5" }} />
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 20 }}>
                    {/* Service Name */}
                    <h3 style={{ 
                      fontSize: 22, 
                      fontWeight: 700, 
                      color: isSelected ? "#185FA5" : "#2C2C2A",
                      margin: 0,
                      lineHeight: 1.3
                    }}>
                      {service.service_name}
                    </h3>

                    {/* Description */}
                    <p style={{ 
                      color: "#5F5E5A", 
                      lineHeight: 1.6, 
                      fontSize: 15,
                      flex: 1,
                      margin: 0
                    }}>
                      {cleanDesc.length > 180 
                        ? cleanDesc.substring(0, 177) + '...' 
                        : cleanDesc || service.service_small_desc}
                    </p>

                    {/* Price Section */}
                    {service.service_per_session_discount_price && (
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span style={{ 
                            fontSize: 26, 
                            fontWeight: 700, 
                            color: "#185FA5" 
                          }}>
                            ₹{service.service_per_session_discount_price.toLocaleString('en-IN')}
                          </span>
                          {service.service_per_session_price > service.service_per_session_discount_price && (
                            <span style={{ 
                              fontSize: 15, 
                              color: "#B4B2A9", 
                              textDecoration: "line-through" 
                            }}>
                              ₹{service.service_per_session_price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: "#B4B2A9", marginTop: 2 }}>
                          per session
                        </p>
                      </div>
                    )}

                    {/* Action */}
                    <div style={{ 
                      marginTop: "auto", 
                      paddingTop: 12,
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between",
                      borderTop: "0.5px solid #EAF3DE"
                    }}>
                      <span style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: isSelected ? "#185FA5" : "#185FA5" 
                      }}>
                        {isSelected ? "✓ Selected" : "Select this service"}
                      </span>
                      
                      {!isSelected && (
                        <ArrowRight size={20} style={{ color: "#185FA5" }} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Note */}
        <div style={{ 
          textAlign: "center", 
          marginTop: 40, 
          fontSize: 13, 
          color: "#B4B2A9" 
        }}>
          All treatments are performed by Dr. Rajneesh Kant at our Patna & Mumbai clinics.
        </div>
      </div>
    </div>
  );
};

export default ServiceStep;