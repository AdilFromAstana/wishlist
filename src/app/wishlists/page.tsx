"use client";

import { Shell } from "@/components/Shell";
import { WishlistBrowser } from "@/components/WishlistBrowser";

export default function WishlistsPage() {
  return (
    <Shell>
      <WishlistBrowser mode="all" />
    </Shell>
  );
}
