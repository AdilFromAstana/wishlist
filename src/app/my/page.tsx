"use client";

import { ProtectedShell } from "@/components/ProtectedShell";
import { WishlistBrowser } from "@/components/WishlistBrowser";

export default function MyWishlistsPage() {
  return (
    <ProtectedShell>
      <WishlistBrowser mode="mine" />
    </ProtectedShell>
  );
}
