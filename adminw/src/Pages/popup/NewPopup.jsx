"use client";

import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "@/constant/Urls";

const NewPopup = () => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    doctorName: "",
    location: "",
    availableDate: "",
    availableTime: "",
    startAt: "",
    endAt: "",
    priority: 1,
    isActive: true,
    buttonText: "",
    buttonLink: "",
    openInNewTab: false,
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });

      if (image) {
        payload.append("image", image);
      }

      const { data } = await axios.post(
        `${API_URL}/popup`,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(data.message || "Popup Created");

      setFormData({
        title: "",
        description: "",
        doctorName: "",
        location: "",
        availableDate: "",
        availableTime: "",
        startAt: "",
        endAt: "",
        priority: 1,
        isActive: true,
        buttonText: "",
        buttonLink: "",
        openInNewTab: false,
      });

      setImage(null);
      setPreview("");
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          "Failed to create popup"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8">
          Create Popup
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Image */}
          <div>
            <label className="block font-medium mb-2">
              Popup Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="w-full border rounded-lg p-3"
            />

            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-4 h-40 rounded-lg border object-cover"
              />
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block font-medium mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium mb-2">
              Description
            </label>
            <textarea
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Doctor Name */}
            <div>
              <label className="block font-medium mb-2">
                Doctor Name
              </label>
              <input
                type="text"
                name="doctorName"
                value={formData.doctorName}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block font-medium mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Available Date */}
            <div>
              <label className="block font-medium mb-2">
                Available Date
              </label>
              <input
                type="date"
                name="availableDate"
                value={formData.availableDate}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>

            {/* Available Time */}
            <div>
              <label className="block font-medium mb-2">
                Available Time
              </label>
              <input
                type="text"
                placeholder="10:00 AM - 5:00 PM"
                name="availableTime"
                value={formData.availableTime}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block font-medium mb-2">
                Popup Start At
              </label>
              <input
                type="datetime-local"
                name="startAt"
                value={formData.startAt}
                onChange={handleChange}
                required
                className="w-full border rounded-lg p-3"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block font-medium mb-2">
                Popup End At
              </label>
              <input
                type="datetime-local"
                name="endAt"
                value={formData.endAt}
                onChange={handleChange}
                required
                className="w-full border rounded-lg p-3"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block font-medium mb-2">
                Priority
              </label>
              <input
                type="number"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>

            {/* Active */}
            <div className="flex items-center gap-3 mt-8">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <label>Active Popup</label>
            </div>
          </div>

          <hr />

          <h2 className="text-xl font-semibold">
            Button Settings
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-2">
                Button Text
              </label>
              <input
                type="text"
                name="buttonText"
                value={formData.buttonText}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">
                Button Link
              </label>
              <input
                type="text"
                name="buttonLink"
                value={formData.buttonLink}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="openInNewTab"
              checked={formData.openInNewTab}
              onChange={handleChange}
            />
            <label>Open In New Tab</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Popup"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPopup;