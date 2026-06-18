import { useEffect, useState } from "react";
import api from "@/lib/axios";

// Fetches the full doctor list once (used in dropdowns / multiselects).
export function useDoctors() {
  const [doctors, setDoctors] = useState([]);
  useEffect(() => {
    api
      .get("/get-all-doctor")
      .then((res) => setDoctors(res.data.data || res.data.doctors || []))
      .catch(() => setDoctors([]));
  }, []);
  return doctors;
}

// Fetches the full clinic list once. Handles both response shapes the
// backend uses ({ data: { clinics } } or { data: [...] }).
export function useClinics() {
  const [clinics, setClinics] = useState([]);
  useEffect(() => {
    api
      .get("/get-all-clinic")
      .then((res) => setClinics(res.data.data?.clinics || res.data.data || []))
      .catch(() => setClinics([]));
  }, []);
  return clinics;
}
