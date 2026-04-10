import { UserRole } from "../types";

export const getDefaultRouteForRole = (role?: UserRole) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "seller":
      return "/seller/dashboard";
    default:
      return "/";
  }
};
