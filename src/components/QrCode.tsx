"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  value: string;
  size?: number;
}

export function QrCode({ value, size = 160 }: Props) {
  const [dataUrl, setDataUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#111827", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  if (failed) return null;

  return (
    <div
      className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2"
      style={{ width: size + 16, height: size + 16 }}
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="QR-код на товар" width={size} height={size} />
      ) : (
        <div className="h-full w-full animate-pulse rounded bg-gray-100" />
      )}
    </div>
  );
}
