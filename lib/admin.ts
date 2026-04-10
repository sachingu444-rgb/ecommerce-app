import { UserRole } from "../types";

const ADMIN_EMAILS = ["sachingu444@gmail.com"];

export const isPrivilegedAdminEmail = (email?: string | null) =>
  typeof email === "string" &&
  ADMIN_EMAILS.includes(email.trim().toLowerCase());

export const resolveRoleForEmail = (
  role: UserRole | undefined,
  email?: string | null
): UserRole => (isPrivilegedAdminEmail(email) ? "admin" : role || "buyer");
