import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import React from "react"

import Home from "./pages/home/Home"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import Profile from "./pages/user/profile";
import DashboardLayout from "./layouts/DashboardLayout";
import AboutApp from "./pages/user/aboutApp";
import Configuration from "./pages/user/configuration";
import Start from "./pages/user/start";
import UsersControl from "./pages/user/usersControl";
import Reports from "./pages/user/reports";

const App = function App() {
  useEffect(() => {
    AOS.init();
  }, []);
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>}/>
      <Route path="/aboutapp" element={<DashboardLayout><AboutApp /></DashboardLayout>}/>
      <Route path="/configuration" element={<DashboardLayout><Configuration /></DashboardLayout>}/>
      <Route path="/start" element={<DashboardLayout><Start /></DashboardLayout>}/>
      <Route path="/userscontrol" element={<DashboardLayout><UsersControl /></DashboardLayout>}/>
      <Route path="/reports" element={<DashboardLayout><Reports /></DashboardLayout>}/>
    </Routes>
  );
}

export default App;