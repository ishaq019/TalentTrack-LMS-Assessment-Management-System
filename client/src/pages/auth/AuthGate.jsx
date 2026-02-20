import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/state/auth.jsx";

export default function AuthGate({ children }) {
  const { isReady, isAuthed, user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthed) return;

    nav(user?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }, [isReady, isAuthed, user, nav]);

  if (!isReady) return null;
  if (isAuthed) return null;

  return children;
}
