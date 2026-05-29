import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    const currentRole = user.role ? user.role.toUpperCase() : "";
    const targetRole = role.toUpperCase();

    // တကယ်လို့ Backend က "ROLE_ADMIN" လို့ ပို့ခဲ့ရင်လည်း "ADMIN" နဲ့ ကိုက်ညီအောင် .includes() ဖြင့် စစ်ခြင်း
    const hasRole = currentRole.includes(targetRole);

    if (!hasRole) {
      if (currentRole.includes("CASHIER")) {
        return <Navigate to="/cashier" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;