import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import React from "react"

import HomeLayout from "./layouts/HomeLayout"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"

const App = function App() {
  useEffect(() => {
    AOS.init();
  }, []);
  return (
    <Routes>
      <Route path="/" element={<HomeLayout><Home /></HomeLayout>} />
      <Route path="/login" element={<HomeLayout><Login /></HomeLayout>} />
      <Route path="/register" element={<HomeLayout><Register /></HomeLayout>} />
    </Routes>
  );
}

export default App;