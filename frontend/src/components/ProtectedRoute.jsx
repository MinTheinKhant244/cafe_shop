import { Navigate } from "react-router-dom"

function ProtectedRoute({ children, role }) {

  const user = JSON.parse(localStorage.getItem("user"))
  const token = localStorage.getItem("token")

  if (!token) {
    return <Navigate to="/login" />
  }

  if (role && user?.role !== role) {
    return <Navigate to="/login" />
  }

//   if(role !== "ADMIN"){
//     return <Navigate to="/cashier" />
//     }

  return children
}

export default ProtectedRoute