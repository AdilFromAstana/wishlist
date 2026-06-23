"use client";

import { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { Navbar } from "./Navbar";

export function ProtectedShell({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Загрузка…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
