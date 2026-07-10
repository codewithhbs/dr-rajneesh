"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "@/constant/Urls";

const AllPopup = () => {
    const [popups, setPopups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editingPopup, setEditingPopup] = useState(null);
    const [newImageFile, setNewImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const fetchPopups = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/popup`);
            setPopups(data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPopups();
    }, []);

    const deletePopup = async (id) => {
        if (!confirm("Delete this popup?")) return;

        try {
            await axios.delete(`${API_URL}/popup/${id}`);
            setPopups((prev) => prev.filter((item) => item._id !== id));
        } catch (err) {
            console.error(err);
            alert("Delete failed");
        }
    };

    const toggleStatus = async (popup) => {
        try {
            const fd = new FormData();
            fd.append("isActive", !popup.isActive);

            const { data } = await axios.put(`${API_URL}/popup/${popup._id}`, fd);

            setPopups((prev) =>
                prev.map((item) => (item._id === popup._id ? data.data : item))
            );
        } catch (err) {
            console.error(err);
        }
    };

    const openEdit = (popup) => {
        setEditingPopup({
            ...popup,
            buttonText: popup.button?.text || "",
            buttonLink: popup.button?.link || "",
            openInNewTab: popup.button?.openInNewTab || false,
        });
        setNewImageFile(null);
        setImagePreview(popup.image || null);
    };

    const closeEdit = () => {
        setEditingPopup(null);
        setNewImageFile(null);
        setImagePreview(null);
    };

    const onImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setNewImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const updatePopup = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const fd = new FormData();

            fd.append("title", editingPopup.title || "");
            fd.append("description", editingPopup.description || "");
            fd.append("doctorName", editingPopup.doctorName || "");
            fd.append("location", editingPopup.location || "");
            fd.append("availableDate", editingPopup.availableDate || "");
            fd.append("availableTime", editingPopup.availableTime || "");
            fd.append("startAt", editingPopup.startAt || "");
            fd.append("endAt", editingPopup.endAt || "");
            fd.append("priority", editingPopup.priority ?? "");
            fd.append("isActive", editingPopup.isActive ?? true);
            fd.append(
                "button",
                JSON.stringify({
                    text: editingPopup.buttonText || "",
                    link: editingPopup.buttonLink || "",
                    openInNewTab: !!editingPopup.openInNewTab,
                })
            );

            if (newImageFile) {
                fd.append("image", newImageFile);
            }

            const { data } = await axios.put(
                `${API_URL}/popup/${editingPopup._id}`,
                fd,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            setPopups((prev) =>
                prev.map((item) => (item._id === editingPopup._id ? data.data : item))
            );

            closeEdit();
        } catch (err) {
            console.error(err);
            alert("Update failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-10 text-center">Loading...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">All Popups</h1>

            <div className="grid md:grid-cols-3 gap-6">
                {popups.map((popup) => (
                    <div
                        key={popup._id}
                        className="bg-white border rounded-xl overflow-hidden shadow"
                    >
                        <img
                            src={popup.image}
                            alt={popup.title}
                            className="w-full h-48 object-cover"
                        />

                        <div className="p-4">
                            <h2 className="font-bold text-lg">{popup.title}</h2>
                            <p className="text-gray-500 text-sm mt-2">{popup.location}</p>

                            <div className="mt-3">
                                <span
                                    className={`px-3 py-1 rounded-full text-xs ${popup.isActive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {popup.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => openEdit(popup)}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded"
                                >
                                    Edit
                                </button>

                                <button
                                    onClick={() => toggleStatus(popup)}
                                    className="flex-1 bg-yellow-500 text-white py-2 rounded"
                                >
                                    Status
                                </button>

                                <button
                                    onClick={() => deletePopup(popup._id)}
                                    className="flex-1 bg-red-600 text-white py-2 rounded"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* EDIT MODAL */}
            {editingPopup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-2xl rounded-xl p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-5">Edit Popup</h2>

                        <form onSubmit={updatePopup} className="space-y-4">
                            {/* Image */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Image
                                </label>
                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        alt="preview"
                                        className="w-full h-40 object-cover rounded mb-2"
                                    />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={onImageChange}
                                    className="w-full border p-2 rounded"
                                />
                            </div>

                            <input
                                type="text"
                                value={editingPopup.title || ""}
                                onChange={(e) =>
                                    setEditingPopup({ ...editingPopup, title: e.target.value })
                                }
                                className="w-full border p-3 rounded"
                                placeholder="Title"
                            />

                            <textarea
                                value={editingPopup.description || ""}
                                onChange={(e) =>
                                    setEditingPopup({
                                        ...editingPopup,
                                        description: e.target.value,
                                    })
                                }
                                className="w-full border p-3 rounded"
                                rows={4}
                                placeholder="Description"
                            />

                            <input
                                type="text"
                                value={editingPopup.doctorName || ""}
                                onChange={(e) =>
                                    setEditingPopup({
                                        ...editingPopup,
                                        doctorName: e.target.value,
                                    })
                                }
                                className="w-full border p-3 rounded"
                                placeholder="Doctor Name"
                            />

                            <input
                                type="text"
                                value={editingPopup.location || ""}
                                onChange={(e) =>
                                    setEditingPopup({
                                        ...editingPopup,
                                        location: e.target.value,
                                    })
                                }
                                className="w-full border p-3 rounded"
                                placeholder="Location"
                            />

                            {/* Available Date */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Available Date
                                </label>
                                <input
                                    type="date"
                                    value={
                                        editingPopup.availableDate
                                            ? editingPopup.availableDate.substring(0, 10)
                                            : ""
                                    }
                                    onChange={(e) =>
                                        setEditingPopup({
                                            ...editingPopup,
                                            availableDate: e.target.value,
                                        })
                                    }
                                    className="w-full border p-3 rounded"
                                />
                            </div>

                            <input
                                type="text"
                                value={editingPopup.availableTime || ""}
                                onChange={(e) =>
                                    setEditingPopup({
                                        ...editingPopup,
                                        availableTime: e.target.value,
                                    })
                                }
                                className="w-full border p-3 rounded"
                                placeholder="Available Time"
                            />

                            {/* Start / End At */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Start At
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={
                                            editingPopup.startAt
                                                ? editingPopup.startAt.substring(0, 16)
                                                : ""
                                        }
                                        onChange={(e) =>
                                            setEditingPopup({
                                                ...editingPopup,
                                                startAt: e.target.value,
                                            })
                                        }
                                        className="w-full border p-3 rounded"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        End At
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={
                                            editingPopup.endAt
                                                ? editingPopup.endAt.substring(0, 16)
                                                : ""
                                        }
                                        onChange={(e) =>
                                            setEditingPopup({
                                                ...editingPopup,
                                                endAt: e.target.value,
                                            })
                                        }
                                        className="w-full border p-3 rounded"
                                    />
                                </div>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Priority
                                </label>
                                <input
                                    type="number"
                                    value={editingPopup.priority ?? ""}
                                    onChange={(e) =>
                                        setEditingPopup({
                                            ...editingPopup,
                                            priority: e.target.value,
                                        })
                                    }
                                    className="w-full border p-3 rounded"
                                    placeholder="Priority"
                                />
                            </div>

                            <input
                                type="text"
                                value={editingPopup.buttonText || ""}
                                onChange={(e) =>
                                    setEditingPopup({
                                        ...editingPopup,
                                        buttonText: e.target.value,
                                    })
                                }
                                className="w-full border p-3 rounded"
                                placeholder="Button Text"
                            />

                            <input
                                type="text"
                                value={editingPopup.buttonLink || ""}
                                onChange={(e) =>
                                    setEditingPopup({
                                        ...editingPopup,
                                        buttonLink: e.target.value,
                                    })
                                }
                                className="w-full border p-3 rounded"
                                placeholder="Button Link"
                            />

                            {/* Open In New Tab */}
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={!!editingPopup.openInNewTab}
                                    onChange={(e) =>
                                        setEditingPopup({
                                            ...editingPopup,
                                            openInNewTab: e.target.checked,
                                        })
                                    }
                                />
                                Open In New Tab
                            </label>

                            {/* Is Active */}
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={!!editingPopup.isActive}
                                    onChange={(e) =>
                                        setEditingPopup({
                                            ...editingPopup,
                                            isActive: e.target.checked,
                                        })
                                    }
                                />
                                Active
                            </label>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-green-600 text-white px-5 py-2 rounded disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save"}
                                </button>

                                <button
                                    type="button"
                                    onClick={closeEdit}
                                    className="bg-gray-300 px-5 py-2 rounded"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllPopup;