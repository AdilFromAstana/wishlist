"use client";

import { QrCode } from "./QrCode";

interface Props {
  value: string;
  title?: string;
  onClose: () => void;
}

export function QrModal({ value, title, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          ✕
        </button>

        <div className="mb-1 text-3xl">📱</div>
        <h3 className="mb-1 text-lg font-bold">Сканируй телефоном</h3>
        {title && (
          <p className="mb-5 truncate text-sm text-gray-500">{title}</p>
        )}

        <div className="flex justify-center">
          <QrCode value={value} size={240} />
        </div>

        <p className="mt-5 break-all text-xs text-gray-400">{value}</p>

        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Открыть ссылку
        </a>
      </div>
    </div>
  );
}
