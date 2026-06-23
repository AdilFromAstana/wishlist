"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function HomePage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(session ? "/wishlists" : "/login");
  }, [session, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-gray-500">
      Загрузка…
    </div>
  );
}
