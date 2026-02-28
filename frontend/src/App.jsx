import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import React from "react"

import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"

const App = function App() {
  useEffect(() => {
    AOS.init();
  }, []);
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;