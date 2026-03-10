import { Navigate, useLocation } from "react-router-dom"
import MenuBar from "../components/MenuBar"

function DashboardLayout({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {return <Navigate to="/login" replace state={{ from: location.pathname }} />;}

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
        <main className="relative flex-1 min-h-0 overflow-y-auto">
          {children}
        </main>
        <MenuBar />
    </div>
  )
}

export default DashboardLayout