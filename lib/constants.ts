import type { UserRole } from "@/types";

export const SUBSCRIPTION_PRICE = 11.99;
export const SUBSCRIPTION_CURRENCY = "EUR";

export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  player: "/matches",
  operator: "/operator",
  admin: "/admin",
};
