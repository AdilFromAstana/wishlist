import type { Priority, Status } from "@/lib/types";

const statusStyles: Record<Status, string> = {
  not_purchased: "bg-amber-100 text-amber-800",
  purchased: "bg-green-100 text-green-800",
};

const statusLabels: Record<Status, string> = {
  not_purchased: "Не куплено",
  purchased: "Куплено",
};

const priorityStyles: Record<Priority, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-blue-100 text-blue-800",
  low: "bg-gray-100 text-gray-700",
};

const priorityLabels: Record<Priority, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const base =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`${base} ${statusStyles[status]}`}>{statusLabels[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`${base} ${priorityStyles[priority]}`}>
      {priorityLabels[priority]}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`${base} ${
        active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"
      }`}
    >
      {active ? "Активно" : "Неактивно"}
    </span>
  );
}
