import { Navigate, Outlet, useLocation } from "react-router-dom"
import Controls from "../components/shared/Controls";

// import MinecraftBackground from "../components/home/MinecraftBackground";

function DashboardLayout({ children, maxWidthClass = "max-w-[1800px]" }) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {return <Navigate to="/login" replace state={{ from: location.pathname }} />;}

  return (
    <Controls maxWidthClass={maxWidthClass}>{children || <Outlet />}</Controls>
  );
}

export default DashboardLayout