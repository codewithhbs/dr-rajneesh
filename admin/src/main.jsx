import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(

    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
      </AuthProvider>
    </BrowserRouter>
);
