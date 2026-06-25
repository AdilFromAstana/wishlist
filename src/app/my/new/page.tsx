"use client";

import { useRouter } from "next/navigation";
import { ProtectedShell } from "@/components/ProtectedShell";
import { WishlistForm } from "@/components/WishlistForm";
import { useData } from "@/components/DataProvider";

export default function NewWishlistPage() {
  const router = useRouter();
  const { loading, upsertItem } = useData();

  return (
    <ProtectedShell>
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => router.push("/my")}
          aria-label="Назад"
          className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-2xl text-gray-600 hover:bg-gray-100"
        >
          ←
        </button>
        <h1 className="text-xl font-bold sm:text-2xl">Добавить желание</h1>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500">Загрузка…</div>
      ) : (
        <WishlistForm
          onCancel={() => router.push("/my")}
          onSaved={(saved) => {
            upsertItem(saved);
            router.push("/my");
          }}
        />
      )}
    </ProtectedShell>
  );
}
