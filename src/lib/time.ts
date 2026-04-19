export type TimeUnit = "minutes" | "hours" | "days";

export function toMinutes(value: number, unit: TimeUnit): number {
  switch (unit) {
    case "minutes": return value;
    case "hours": return value * 60;
    case "days": return value * 1440;
  }
}

export function toReadable(minutes: number): { value: number; unit: TimeUnit } {
  if (minutes % 1440 === 0) return { value: minutes / 1440, unit: "days" };
  if (minutes % 60 === 0) return { value: minutes / 60, unit: "hours" };
  return { value: minutes, unit: "minutes" };
}

export function toDisplayString(minutes: number): string {
  const { value, unit } = toReadable(minutes);
  if (unit === "days") return value === 1 ? "1 day" : `${value} days`;
  if (unit === "hours") return value === 1 ? "1 hour" : `${value} hours`;
  return value === 1 ? "1 minute" : `${value} minutes`;
}

export function formatPreviewDate(minutesFromNow: number): string {
  const date = new Date(Date.now() + minutesFromNow * 60 * 1000);
  return (
    date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }) +
    " at " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  );
}

export const MIN_FOLLOW_UP_MINUTES = 5;
export const MAX_FOLLOW_UP_MINUTES = 43200; // 30 days
