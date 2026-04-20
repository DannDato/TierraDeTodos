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
// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
// Páginas de usuario
import AboutApp from "./pages/user/aboutApp";
import Configuration from "./pages/user/configuration";
import Start from "./pages/user/start";
import Reports from "./pages/user/Reports";
import Download from "./pages/user/download";
import Players from "./pages/user/players";
import News from "./pages/user/news";
// Páginas de admin
import Users from "./pages/admin/users";
import Gestion from "./pages/admin/gestion";

import NotFound from "./pages/home/NotFound";


const App = function App() {
  const location = useLocation();

  useEffect(() => {
    window.AOS?.init();
  }, []);

  useEffect(() => {
    window.AOS?.refreshHard();
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verifyAccess" element={<VerifyAccess />} />

      <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>}/>
      <Route path="/aboutapp" element={<DashboardLayout><AboutApp /></DashboardLayout>}/>
      <Route path="/configuration" element={<DashboardLayout><Configuration /></DashboardLayout>}/>
      <Route path="/start" element={<DashboardLayout><Start /></DashboardLayout>}/>
      <Route path="/tickets" element={<DashboardLayout><Reports /></DashboardLayout>}/>
      <Route path="/download" element={<DashboardLayout><Download /></DashboardLayout>}/>
      <Route path="/players" element={<DashboardLayout><Players /></DashboardLayout>}/>
      <Route path="/news" element={<DashboardLayout><News /></DashboardLayout>}/>
      <Route path="/gestion" element={<DashboardLayout><Gestion /></DashboardLayout>}/>
      
      <Route path="/users" element={<DashboardLayout><Users /></DashboardLayout>}/>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;