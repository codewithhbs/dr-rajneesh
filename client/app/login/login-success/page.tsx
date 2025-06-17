"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/authContext/auth";
import Loading from "@/components/ui/Loading";

const GoogleCallbackPage = () => {
  const { setToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      router.replace("/");
    }
  }, [searchParams, router]);

  return <Loading message="Authenticating with Google, please wait..." />;
};

export default GoogleCallbackPage;
