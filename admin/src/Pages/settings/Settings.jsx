import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/axios";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";

const TABS = [
  { key: "general", label: "General" },
  { key: "branding", label: "Branding" },
  { key: "payment", label: "Payment" },
  { key: "contact", label: "Contact" },
  { key: "social", label: "Social" },
  { key: "seo", label: "SEO" },
  { key: "booking", label: "Booking" },
  { key: "system", label: "System" },
];

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("general");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/get-config-settings");
        setSettings(data.data || {});
      } catch {
        toast.error("Failed to load settings");
        setSettings({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const setTop = (key) => (e) => setSettings((s) => ({ ...s, [key]: e.target.value }));
  const setNested = (group, key) => (e) => {
    const { type, value, checked } = e.target;
    const v = type === "checkbox" ? checked : value;
    setSettings((s) => ({ ...s, [group]: { ...(s[group] || {}), [key]: v } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // If a logo file was chosen, send multipart; otherwise plain JSON.
      if (logoFile) {
        const fd = new FormData();
        fd.append("logo", logoFile);
        fd.append("data", JSON.stringify(settings));
        await api.put(`/update-config-settings/${settings._id}`, fd);
      } else {
        await api.put(`/update-config-settings/${settings._id}`, settings);
      }
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading settings..." />;

  const g = (group) => settings[group] || {};

  return (
    <div>
      <PageHeader
        title="Web Settings"
        subtitle="Configure your site, payments and integrations."
        actions={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex gap-1 overflow-x-auto border-b border-gray-200 px-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                tab === t.key
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "general" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="App Name" value={settings.app_name || ""} onChange={setTop("app_name")} />
              <Input label="Website URL" value={settings.website_url || ""} onChange={setTop("website_url")} />
            </div>
          )}

          {tab === "branding" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  {g("branding").logo?.url ? (
                    <img src={g("branding").logo.url} alt="logo" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-xs text-gray-400">No logo</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Upload Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
                  />
                  {logoFile && <p className="text-xs text-green-600">Selected: {logoFile.name}</p>}
                </div>
              </div>
            </div>
          )}

          {tab === "payment" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Default Currency"
                value={g("payment_config").default_currency || ""}
                onChange={setNested("payment_config", "default_currency")}
              />
              <Input
                label="Tax %"
                type="number"
                value={g("payment_config").tax_percentage || ""}
                onChange={setNested("payment_config", "tax_percentage")}
              />
              <Input
                label="Convenience Fee"
                type="number"
                value={g("payment_config").convenience_fee || ""}
                onChange={setNested("payment_config", "convenience_fee")}
              />
            </div>
          )}

          {tab === "contact" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Phone Number"
                value={g("contact_details").phone_number || ""}
                onChange={setNested("contact_details", "phone_number")}
              />
              <Input
                label="Email"
                value={g("contact_details").email || ""}
                onChange={setNested("contact_details", "email")}
              />
              <Input
                label="Support Email"
                value={g("contact_details").support_email || ""}
                onChange={setNested("contact_details", "support_email")}
              />
            </div>
          )}

          {tab === "social" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Facebook"
                value={g("social_links").facebook || ""}
                onChange={setNested("social_links", "facebook")}
              />
              <Input
                label="Instagram"
                value={g("social_links").instagram || ""}
                onChange={setNested("social_links", "instagram")}
              />
              <Input
                label="WhatsApp"
                value={g("social_links").whatsapp || ""}
                onChange={setNested("social_links", "whatsapp")}
              />
              <Input
                label="YouTube"
                value={g("social_links").youtube || ""}
                onChange={setNested("social_links", "youtube")}
              />
            </div>
          )}

          {tab === "seo" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Google Analytics ID"
                placeholder="G-XXXXXXXXXX"
                value={g("seo_settings").google_analytics_id || ""}
                onChange={setNested("seo_settings", "google_analytics_id")}
              />
              <Input
                label="Facebook Pixel ID"
                value={g("seo_settings").facebook_pixel_id || ""}
                onChange={setNested("seo_settings", "facebook_pixel_id")}
              />
            </div>
          )}

          {tab === "booking" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Slots Per Hour"
                type="number"
                value={g("booking_config").slots_per_hour || ""}
                onChange={setNested("booking_config", "slots_per_hour")}
              />
              <Input
                label="Booking Limit Per Slot"
                type="number"
                value={g("booking_config").booking_limit_per_slot || ""}
                onChange={setNested("booking_config", "booking_limit_per_slot")}
              />
            </div>
          )}

          {tab === "system" && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={!!g("system_settings").maintenance_mode}
                  onChange={setNested("system_settings", "maintenance_mode")}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                Maintenance mode
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={!!g("system_settings").allow_registrations}
                  onChange={setNested("system_settings", "allow_registrations")}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                Allow new registrations
              </label>
              <div className="max-w-xs">
                <Input
                  label="Max File Upload Size (MB)"
                  type="number"
                  value={g("system_settings").max_file_upload_size || ""}
                  onChange={setNested("system_settings", "max_file_upload_size")}
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
