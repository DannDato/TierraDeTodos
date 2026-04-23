import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import React from "react"

// Páginas de home
import Home from "./pages/home/Home"
// Páginas de autenticación
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import Profile from "./pages/user/Profile";
import VerifyAccess from "./pages/auth/VerifyAccess"
import PasswordRecovery from "./pages/auth/passwordRecovery"
// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
// Páginas de usuario
import AboutApp from "./pages/user/aboutApp";
import Configuration from "./pages/user/configuration";
import Start from "./pages/user/start";
import Tickets from "./pages/user/Tickets";
import Download from "./pages/user/download";
import Players from "./pages/user/players";
import News from "./pages/user/news";
import Community from "./pages/user/Community";
// Páginas de admin
import Users from "./pages/admin/users";
import Gestion from "./pages/admin/gestion";
import Reports from "./pages/admin/Reports";

import NotFound from "./pages/home/NotFound";
import LoadingOverlay from "./components/LoadingOverlay";


const App = function App() {
  const location = useLocation();
  const [routeLoading, setRouteLoading] = React.useState(true);
  const localOverlayRoutes = React.useMemo(
    () => new Set([
      "/login",
      "/register",
      "/verifyAccess",
      "/profile",
      "/tickets",
      "/players",
      "/news",
      "/users",
      "/gestion",
      "/reports",
    ]),
    []
  );

  const shouldUseGlobalOverlay = !localOverlayRoutes.has(location.pathname);

  useEffect(() => {
    window.AOS?.init();
  }, []);

  useEffect(() => {
    window.AOS?.refreshHard();
  }, [location.pathname]);

  useEffect(() => {
    setRouteLoading(true);
    const timer = setTimeout(() => setRouteLoading(false), 220);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      <LoadingOverlay isVisible={shouldUseGlobalOverlay && routeLoading} message="Cargando pantalla..." />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verifyAccess" element={<VerifyAccess />} />
        <Route path="/password-recovery" element={<PasswordRecovery />} />

        <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>}/>
        <Route path="/aboutapp" element={<DashboardLayout><AboutApp /></DashboardLayout>}/>
        <Route path="/configuration" element={<DashboardLayout><Configuration /></DashboardLayout>}/>
        <Route path="/start" element={<DashboardLayout><Start /></DashboardLayout>}/>
        <Route path="/tickets" element={<DashboardLayout><Tickets /></DashboardLayout>}/>
        <Route path="/download" element={<DashboardLayout><Download /></DashboardLayout>}/>
        <Route path="/players" element={<DashboardLayout><Players /></DashboardLayout>}/>
        <Route path="/news" element={<DashboardLayout><News /></DashboardLayout>}/>
        <Route path="/gestion" element={<DashboardLayout><Gestion /></DashboardLayout>}/>
        <Route path="/reports" element={<DashboardLayout><Reports /></DashboardLayout>}/>

        <Route path="/community" element={<DashboardLayout><Community /></DashboardLayout>}/>
        <Route path="/users" element={<DashboardLayout><Users /></DashboardLayout>}/>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;