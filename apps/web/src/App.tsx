import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Rooms from "./Rooms";
import ThemeToggle from "./ThemeToggle";

function RequireAuth({ children }: { children: React.ReactElement }) {
  const loggedIn = !!localStorage.getItem("token");
  return loggedIn ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeToggle />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/rooms" element={<RequireAuth><Rooms /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}