export function formatKzt(value: number): string {
  const formatted = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value || 0);
  return `${formatted} ₸`;
}

export function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
