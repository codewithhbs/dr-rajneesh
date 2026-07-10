import { Route, Routes } from "react-router-dom";
import "./App.css";

import SignInPage from "./Pages/SignInPage";
import DashboardPage from "./Pages/DashboardPage";
import NotFoundPage from "./Pages/NotFoundPage";
import Footer from "./Pages/Footer";
import { Toaster as Sonner } from "sonner"
function App() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* All Routes */}
      <div className="flex-1">
        <Routes>
          <Route path="/" Component={DashboardPage} />  
          <Route path="/admin/login" element={<SignInPage />} />
          <Route path="/dashboard/*" element={<DashboardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      {/* Global Footer */}
      <Sonner
      theme="light"     
      position={"top-center"}      // or "dark" / "system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      
    />
      <Footer />
    </div>
  );
}

export default App;
