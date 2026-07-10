"use client";

import { useState, useEffect } from "react";
import { Globe, Wrench } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";


interface WebSettingsType {
  _id?: string;
  app_name?: string;
  website_url?: string;
  branding?: { logo?: { url?: string; preview?: string; file?: File } };
  payment_config?: { default_currency?: string; tax_percentage?: number; convenience_fee?: number };
  contact_details?: { phone_number?: string; email?: string; support_email?: string };
  social_links?: { facebook?: string; instagram?: string; whatsapp?: string; youtube?: string };
  system_settings?: { maintenance_mode?: boolean; allow_registrations?: boolean; max_file_upload_size?: number };
  seo_settings?: { google_analytics_id?: string; facebook_pixel_id?: string };
  booking_config?: { slots_per_hour?: number; booking_limit_per_slot?: number };
}


const WebSettings = () => {
  const [activeTab, setActiveTab] = useState("web");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<WebSettingsType | null>(null);
  const [formData, setFormData] = useState<WebSettingsType>({});


  const menuItems = [
    { key: "web", label: "Web Settings", icon: Globe },
    { key: "config", label: "Config Settings", icon: Wrench },
  ];

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(
          "http://localhost:7900/api/v1/get-config-settings"
        );
        setSettings(res.data.data);
        setFormData(res.data.data);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Handle nested form changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : value;

    if (name.includes(".")) {
      const keys = name.split(".");
      setFormData((prev) => {
        let temp = { ...prev };
        let obj = temp;
        for (let i = 0; i < keys.length - 1; i++) {
          obj[keys[i]] = obj[keys[i]] || {};
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = finalValue;
        return temp;
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: finalValue }));
    }
  };
// Submit settings
 const handleSubmit = async () => {
    if (!settings?._id) return;

    try {
      const response = await axios.put(
        `http://localhost:7900/api/v1/update-config-settings/${settings._id}`,
        formData,
        { withCredentials: true } // session cookies
      );

      setSettings(response.data.data);
      toast.success("Settings updated successfully!"); // ✅ toast success
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update settings."
      ); // ✅ toast error
    }
  };



  if (loading) return <p className="text-center mt-8">Loading...</p>;

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6 animate-fadeIn">
      {/* Horizontal Tabs */}
      <div className="flex space-x-3 overflow-x-auto border-b border-gray-200 mb-6">
        {menuItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex items-center gap-2 whitespace-nowrap px-5 py-2 text-sm font-medium transition-all rounded ${
                isActive
                  ? "bg-gradient-to-r from-[#155DFC] to-[#0092B8] text-white shadow-md"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="space-y-8">
        {/* Web Settings */}
        {activeTab === "web" && (
          <div className="space-y-6 animate-fadeIn">
            {/* <Toaster position="top-right" reverseOrder={false} /> */}
            <div className="flex gap-6">
              {/* First Column */}
              <section className="flex-1 bg-white border border-gray-200 rounded shadow-sm p-6 space-y-4">
                <h3 className="text-xl font-semibold mb-4"> General Info</h3>
                <div className="h-[1px] bg-gray-300 w-full mb-4"></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website Name
                  </label>
                  <input
                    type="text"
                    name="app_name"
                    value={formData.app_name || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    name="website_url"
                    value={formData.website_url || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>
              </section>

              {/* Second Column */}
              <section className="flex-1 bg-white border border-gray-200 rounded shadow-sm p-6 space-y-4">
                <h3 className="text-xl font-semibold mb-4"> Branding</h3>
                <div className="h-[1px] bg-gray-300 w-full mb-4"></div>

                {/* Logo URL input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo
                  </label>
                  {formData.branding?.logo?.url ? (
                    <img
                      src={formData.branding.logo.url}
                      alt="Logo"
                      className="h-24 w-24 object-contain border border-gray-300 rounded-lg mb-2"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm mb-2">
                      No logo uploaded
                    </span>
                  )}
                </div>

                {/* File upload input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Preview the image
                        const reader = new FileReader();
                        reader.onload = () => {
                          setFormData((prev) => ({
                            ...prev,
                            branding: {
                              ...prev.branding,
                              logo: {
                                ...prev.branding?.logo,
                                preview: reader.result,
                                file: file,
                              },
                            },
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-sm text-gray-500 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  />
                </div>

                {/* Image preview */}
                {formData.branding?.logo?.preview && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preview
                    </label>
                    <img
                      src={formData.branding.logo.preview as string}
                      alt="Logo Preview"
                      className="h-24 w-24 object-contain border border-gray-300 rounded-lg"
                    />
                  </div>
                )}
              </section>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Payment Config */}
              <section className="flex-1 bg-white border border-gray-200 rounded shadow-sm p-6 space-y-4">
                <h3 className="text-xl font-semibold mb-4">Payment Config</h3>
                <div className="h-[1px] bg-gray-300 w-full mb-4"></div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Currency
                  </label>
                  <select
                    name="payment_config.default_currency"
                    value={formData.payment_config?.default_currency || "INR"}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Percentage (%)
                  </label>
                  <input
                    type="number"
                    name="payment_config.tax_percentage"
                    value={formData.payment_config?.tax_percentage || 0}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Convenience Fee
                  </label>
                  <input
                    type="number"
                    name="payment_config.convenience_fee"
                    value={formData.payment_config?.convenience_fee || 0}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>
              </section>

              {/* Contact Details */}
              <section className="flex-1 bg-white border border-gray-200 rounded shadow-sm p-6 space-y-4">
                <h3 className="text-xl font-semibold mb-4">Contact Details</h3>
                <div className="h-[1px] bg-gray-300 w-full mb-4"></div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="contact_details.phone_number"
                    value={formData.contact_details?.phone_number || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="contact_details.email"
                    value={formData.contact_details?.email || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    name="contact_details.support_email"
                    value={formData.contact_details?.support_email || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>
              </section>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Social Links */}
              <section className="flex-1 bg-white border border-gray-200 rounded shadow-sm p-6 space-y-4">
                <h3 className="text-xl font-semibold mb-4">Social Links</h3>
                <div className="h-[1px] bg-gray-300 w-full mb-4"></div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook
                  </label>
                  <input
                    type="text"
                    name="social_links.facebook"
                    value={formData.social_links?.facebook || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    name="social_links.instagram"
                    value={formData.social_links?.instagram || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    name="social_links.whatsapp"
                    value={formData.social_links?.whatsapp || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    YouTube
                  </label>
                  <input
                    type="text"
                    name="social_links.youtube"
                    value={formData.social_links?.youtube || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>
              </section>

              {/* System Settings */}
              <section className="flex-1 bg-white border border-gray-200 rounded shadow-sm p-6 space-y-4">
                <h3 className="text-xl font-semibold mb-4">System Settings</h3>
                <div className="h-[1px] bg-gray-300 w-full mb-4"></div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="system_settings.maintenance_mode"
                      checked={
                        formData.system_settings?.maintenance_mode || false
                      }
                      onChange={handleChange}
                      className="h-5 w-5 accent-blue-600"
                    />
                    Maintenance Mode
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="system_settings.allow_registrations"
                      checked={
                        formData.system_settings?.allow_registrations || false
                      }
                      onChange={handleChange}
                      className="h-5 w-5 accent-blue-600"
                    />
                    Allow Registrations
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max File Upload Size (MB)
                  </label>
                  <input
                    type="number"
                    name="system_settings.max_file_upload_size"
                    value={formData.system_settings?.max_file_upload_size || 10}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>
              </section>
            </div>

            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {/* SEO Settings */}
              <section className="flex-1 bg-white border border-gray-200 rounded shadow-sm p-6 space-y-4">
                <h3 className="text-xl font-semibold mb-4">SEO Settings</h3>
                <div className="h-[1px] bg-gray-300 w-full mb-4"></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Analytics ID
                  </label>
                  <input
                    type="text"
                    name="seo_settings.google_analytics_id"
                    value={formData.seo_settings?.google_analytics_id || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook Pixel ID
                  </label>
                  <input
                    type="text"
                    name="seo_settings.facebook_pixel_id"
                    value={formData.seo_settings?.facebook_pixel_id || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>
              </section>

              {/* Booking Config */}
              <section className="flex-1 bg-white border border-gray-200 rounded shadow-sm p-6 space-y-4">
                <h3 className="text-xl font-semibold mb-4">Booking Config</h3>
                <div className="h-[1px] bg-gray-300 w-full mb-4"></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slots Per Hour
                  </label>
                  <input
                    type="number"
                    name="booking_config.slots_per_hour"
                    value={formData.booking_config?.slots_per_hour || 0}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Booking Limit Per Slot
                  </label>
                  <input
                    type="number"
                    name="booking_config.booking_limit_per_slot"
                    value={formData.booking_config?.booking_limit_per_slot || 0}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  />
                </div>
              </section>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4 mt-6">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => {
                  console.log("Cancelled");
                }}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-300 transition-all duration-200"
              >
                Cancel
              </button>

              {/* Update Settings Button */}
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-700 to-sky-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Update Settings
              </button>
            </div>
          </div>
        )}

        {/* Config Settings */}
        {activeTab === "config" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Keep your Config Settings code from previous version here */}
          </div>
        )}
      </main>
    </div>
  );
};

export default WebSettings;
