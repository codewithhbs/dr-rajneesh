"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/authContext/auth";
import Loading from "@/components/ui/Loading";

export default function GoogleCallbackPage() {
  const { setToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlToken = searchParams?.get("token") || null;
    if (urlToken) {
      setToken(urlToken);
      router.replace("/");
    }
  }, [searchParams, router, setToken]);

  return <Loading message="Authenticating with Google, please wait..." />;
}
