import { Navigate, useLocation } from "react-router-dom"
import MenuBar from "../components/shared/MenuBar"
import Background from "../elements/Background";
import HeadBar from "../components/shared/HeadBar";

// import MinecraftBackground from "../components/home/MinecraftBackground";

function DashboardLayout({ children, maxWidthClass = "max-w-[1800px]" }) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {return <Navigate to="/login" replace state={{ from: location.pathname }} />;}

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[var(--ins-background)]">
      <HeadBar maxWidthClass={maxWidthClass} />
      <Background className={`relative flex-1 min-h-0 overflow-y-auto tdt-scrollbar overflow-x-auto mx-auto w-full ${maxWidthClass}`}>
        {/* <Background> */}
        <div className="absolute inset-0 -z-10 mt-[-60px]">
          {children}
        </div>
        {/* </Background> */}
      </Background>
      <MenuBar />
    </div>
  );
}

export default DashboardLayout