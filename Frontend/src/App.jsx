import React, { useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Chat from "./pages/Chat/Chat";
import Login from "./pages/Login/Login";
import Signup from "./pages/SignUp/Signup";
import Settings from "./pages/Settings/Settings";
import useAuthStore from "./store/useAuthStore";
import PageLoader from "./components/PageLoader/PageLoader";
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();

 // ADD the pathname check
useEffect(() => {
  if (location.pathname !== '/login' && location.pathname !== '/signup') {
    checkAuth();
  }
}, [location.pathname]);
 
 

  if (isCheckingAuth) return <PageLoader />;

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { zIndex: 9999 } }} />
      <ToastContainer position="top-right" />
      <Routes>
        <Route path="/login" element={!authUser ? <Login /> : <Navigate to="/chat" />} />
        <Route path="/signup" element={!authUser ? <Signup /> : <Navigate to="/chat" />} />
        <Route path="/chat" element={authUser ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/settings" element={authUser ? <Settings /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={authUser ? "/chat" : "/login"} />} />
      </Routes>
    </>
  );
}

export default App;