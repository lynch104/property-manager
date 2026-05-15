import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function getMonthName(monthIndex: number): string {
  return new Date(2000, monthIndex, 1).toLocaleString("en-US", { month: "short" });
}

export const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Check", "Mobile Money", "Other"];
export const PAYMENT_STATUSES = ["Paid", "Partial", "Late", "Missed"];
export const EXPENSE_CATEGORIES = [
  "Maintenance",
  "Repairs",
  "Utilities",
  "Insurance",
  "Taxes",
  "Cleaning",
  "Security",
  "Management",
  "Other",
];
export const PROPERTY_TYPES = ["Residential", "Commercial", "Mixed Use", "Industrial"];
export const TENANT_STATUSES = ["Active", "Inactive", "Evicted"];
