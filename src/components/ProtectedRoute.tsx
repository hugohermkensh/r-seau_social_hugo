import { Navigate } from "react-router-dom";
import { currentUserStorage } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const currentUser = currentUserStorage.get();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !isAdmin(currentUser.id)) {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
};
