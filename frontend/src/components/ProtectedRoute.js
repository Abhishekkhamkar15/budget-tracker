import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // App.js handles auth-check; this remains passthrough.
  return <>{children}</>;
}
