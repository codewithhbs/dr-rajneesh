
"use client";
import { useSearchParams } from "next/navigation";

export default function LoginSuccess() {
  const params = useSearchParams();
  const token = params.get("token");

  return <p>Token: {token}</p>;
}
