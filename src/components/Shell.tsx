"use client";

import { ReactNode } from "react";
import { Navbar } from "./Navbar";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
