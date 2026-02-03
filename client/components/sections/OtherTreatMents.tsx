"use client"
import React, { useEffect, useState } from 'react';
import {
  Activity,
  Zap,
  Bone,
  Target,
  Brain,
  Calendar,
  Eye,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { API_ENDPOINT } from '@/constant/url';

interface Service {
  _id: string;
  title: string;
  isActive: boolean;
  position: number;
}

const serviceIcons: Record<string, React.ReactNode> = {
  "Physiotherapy rehabilitation": <Activity className="w-10 h-10 text-blue-600" />,
  "Sport injury": <Zap className="w-10 h-10 text-blue-600" />,
  "Massage therapy": <Bone className="w-10 h-10 text-blue-600" />,
  "Diagnostic services": <Target className="w-10 h-10 text-blue-600" />,
  "Kinesiology therapy": <Brain className="w-10 h-10 text-blue-600" />,
  "Neurotherapy": <Brain className="w-10 h-10 text-blue-600" />,
  "Dietician consultant": <Calendar className="w-10 h-10 text-blue-600" />,
  "Online consultation (for advice)": <Eye className="w-10 h-10 text-blue-600" />,
};

const OtherTreatMents = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${API_ENDPOINT}/other-service`);
        if (response.data.success) {
          const activeServices = response.data.services
            .filter((s: Service) => s.isActive)
            .sort((a: Service, b: Service) => a.position - b.position);
          setServices(activeServices);
        }
      } catch (err) {
        console.error("Error fetching services:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-xl text-gray-600">Loading services...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-xl text-red-600">Failed to load services. Please try again later.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-5 h-5" />
            Comprehensive Care
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            Our Other Services
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            In addition to expert chiropractic care, we offer a wide range of complementary treatments to support your complete recovery and well-being.
          </p>
        </div>

        {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <div
              key={service._id}
              className="bg-white rounded-xl p-6 text-center border border-gray-200 hover:border-blue-400 transition-colors duration-200"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-full mb-4 text-blue-600">
                {serviceIcons[service.title] || <Sparkles className="w-7 h-7" />}
              </div>
              <h3 className="text-lg font-medium text-gray-800">
                {service.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OtherTreatMents;