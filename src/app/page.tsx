"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function HomePage() {
  const { loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace("/wishlists");
  }, [loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-gray-500">
      Загрузка…
    </div>
  );
}
