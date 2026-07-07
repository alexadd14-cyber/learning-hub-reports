export const UserRole = {
  super_admin: "super_admin",
  branch_user: "branch_user",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const SubscriptionStatus = {
  trial: "trial",
  active: "active",
  past_due: "past_due",
  suspended: "suspended",
  cancelled: "cancelled",
} as const;

export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
