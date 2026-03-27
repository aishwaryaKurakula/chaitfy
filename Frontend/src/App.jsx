import React, { useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Chat from "./pages/Chat/Chat";
import Login from "./pages/Login/Login";
import Signup from "./pages/signup/Signup";
import Settings from "./pages/Settings/Settings";
import useAuthStore from  "./store/useAuthStore";
import PageLoader from "./components/PageLoader/PageLoader";
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 🔹 Show loader while checking auth
  if (isCheckingAuth) return <PageLoader />;

  return (
    <>
      {/* Toasts */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            zIndex: 9999,
          },
        }}
      />
      <ToastContainer position="top-right" />

      {/* Routes */}
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={!authUser ? <Login /> : <Navigate to="/chat" />}
        />

        <Route
          path="/signup"
          element={!authUser ? <Signup /> : <Navigate to="/chat" />}
        />

        {/* Main App Routes */}
        <Route
          path="/chat"
          element={authUser ? <Chat /> : <Navigate to="/login" />}
        />

        {/* ✅ SETTINGS ROUTE */}
        <Route
          path="/settings"
          element={authUser ? <Settings /> : <Navigate to="/login" />}
        />

        {/* Default Route */}
        <Route
          path="/"
          element={<Navigate to={authUser ? "/chat" : "/login"} />}
        />
      </Routes>
    </>
  );
}

export default App;