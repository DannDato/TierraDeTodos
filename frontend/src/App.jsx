import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import React from "react"

// Páginas de home
import Home from "./pages/home/Home"
// Páginas de autenticación
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import Profile from "./pages/user/Profile";
import Progress from "./pages/user/Progress";
import VerifyAccess from "./pages/auth/VerifyAccess"
import PasswordRecovery from "./pages/auth/passwordRecovery"
// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
// Páginas de usuario
import Start from "./pages/user/start";
import Tickets from "./pages/user/Tickets";
import Players from "./pages/user/players";
import News from "./pages/user/news";
import Community from "./pages/user/Community";
import Commands from "./pages/user/Commands";
// Páginas de admin
import Users from "./pages/admin/users";
import Gestion from "./pages/admin/gestion";
import Reports from "./pages/admin/Reports";
import EmblemsAdmin from "./pages/admin/Emblems";

import NotFound from "./pages/home/NotFound";
import LoadingOverlay from "./components/shared/LoadingOverlay";


const App = function App() {
  const location = useLocation();
  const [routeLoading, setRouteLoading] = React.useState(true);
  const localOverlayRoutes = React.useMemo(
    () => new Set([
      "/login",
      "/register",
      "/verifyAccess",
      "/start",
      "/profile",
      "/progress",
      "/tickets",
      "/players",
      "/news",
      "/community",
      "/commands",
      "/users",
      "/gestion",
      "/reports",
      "/emblems-admin",
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

        <Route element={<DashboardLayout />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/start" element={<Start />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/players" element={<Players />} />
          <Route path="/news" element={<News />} />
          <Route path="/gestion" element={<Gestion />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/emblems-admin" element={<EmblemsAdmin />} />
          <Route path="/commands" element={<Commands />} />
          <Route path="/community" element={<Community />} />
          <Route path="/users" element={<Users />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;