import type { ReactNode } from "react";

interface RoleBasedDashboards {
  children: ReactNode;
}

export default function DashboardLayout({ children }: RoleBasedDashboards) {
  return children;
}
