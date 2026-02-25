import { Routes, Route } from "react-router-dom";
import HomeLayout from "./layouts/HomeLayout"
import Home from "./pages/Home"
import Login from "./pages/Login"
import React from "react"

const App = function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeLayout><Home /></HomeLayout>} />
      <Route path="/login" element={<HomeLayout><Login /></HomeLayout>} />
    </Routes>
  );
}

export default App;