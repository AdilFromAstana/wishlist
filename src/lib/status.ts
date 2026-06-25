import type { Status } from "./types";

export const STATUS_ORDER: Status[] = [
  "wanted",
  "ordered",
  "shipping",
  "received",
  "given",
];

export const STATUS_LABELS: Record<Status, string> = {
  wanted: "Хочет",
  ordered: "Заказал",
  shipping: "В пути",
  received: "Получил",
  given: "Выдал",
};

export const STATUS_SHORT: Record<Status, string> = {
  wanted: "Хочет",
  ordered: "Заказал",
  shipping: "В пути",
  received: "Получил",
  given: "Выдал",
};

export const STATUS_BADGE: Record<Status, string> = {
  wanted: "bg-amber-100 text-amber-800",
  ordered: "bg-blue-100 text-blue-800",
  shipping: "bg-indigo-100 text-indigo-800",
  received: "bg-violet-100 text-violet-800",
  given: "bg-green-100 text-green-800",
};

export const STATUS_DOT: Record<Status, string> = {
  wanted: "bg-amber-500",
  ordered: "bg-blue-500",
  shipping: "bg-indigo-500",
  received: "bg-violet-500",
  given: "bg-green-500",
};

export function statusIndex(status: Status): number {
  const i = STATUS_ORDER.indexOf(status);
  return i === -1 ? 0 : i;
}
