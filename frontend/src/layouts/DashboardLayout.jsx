import { Navigate, useLocation } from "react-router-dom"
import MenuBar from "../components/shared/MenuBar"
import Background from "../elements/Background";
// import MinecraftBackground from "../components/home/MinecraftBackground";

function DashboardLayout({ children, maxWidthClass = "max-w-[1400px]" }) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {return <Navigate to="/login" replace state={{ from: location.pathname }} />;}

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[var(--ins-background)]">
      <Background className={`relative flex-1 min-h-0 overflow-y-auto tdt-scrollbar overflow-x-auto mx-auto w-full ${maxWidthClass}`}>
        {/* <Background> */}

        {children}
        {/* </Background> */}
      </Background>
      <MenuBar />
    </div>
  );
}

export default DashboardLayout