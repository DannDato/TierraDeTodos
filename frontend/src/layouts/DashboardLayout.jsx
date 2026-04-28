import { Navigate, useLocation } from "react-router-dom"
import MenuBar from "../components/MenuBar"

function DashboardLayout({ children, maxWidthClass = "max-w-7xl" }) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {return <Navigate to="/login" replace state={{ from: location.pathname }} />;}

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[var(--ins-background)]">
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5379027312951838"
     crossorigin="anonymous"></script>
      <main className={`relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden mx-auto w-full ${maxWidthClass}`}>
        {children}
      </main>
      <MenuBar />
    </div>
  );
}

export default DashboardLayout