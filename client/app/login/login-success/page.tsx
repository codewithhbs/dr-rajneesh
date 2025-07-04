import React, { Suspense } from "react";
import Loading from "@/components/ui/Loading";
import GoogleCallbackPage from "./GoogleCallbackPage";

export default function LoginSuccessPage() {
  return (
    <Suspense fallback={<Loading message="Authenticating with Google, please wait..." />}>
      <GoogleCallbackPage />
    </Suspense>
  );
}
