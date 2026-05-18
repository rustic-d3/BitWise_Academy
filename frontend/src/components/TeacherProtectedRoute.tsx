import { type ReactNode } from "react";
import { getUserRole } from "../helper-functions/DecodedToken";
import { Navigate } from "react-router-dom";

interface ProtectedRouteParentProps {
  children: ReactNode;
}

export default function ParentProtectedRoute({
  children,
}: ProtectedRouteParentProps) {
  const role = getUserRole();

  if (role === "teacher") {
    return <>{children}</>;
  }

  return (
    <Navigate to="/restricted-page" state={{ fromRestricted: true }} replace />
  );
}
