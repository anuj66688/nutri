import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function formatNumber(num: number | null | undefined, unit: string = ""): string {
  if (num === null || num === undefined || isNaN(num)) {
    return "Data unavailable";
  }
  return `${num.toLocaleString()}${unit ? ` ${unit}` : ""}`;
}
