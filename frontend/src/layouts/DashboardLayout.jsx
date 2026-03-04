import { Navigate, useLocation } from "react-router-dom"
import MenuBar from "../components/MenuBar"

function DashboardLayout({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {return <Navigate to="/login" replace state={{ from: location.pathname }} />;}

  return (
    <>
        <main className="pb-16">
          {children}
        </main>
        <MenuBar />
    </>
  )
}

export default DashboardLayout