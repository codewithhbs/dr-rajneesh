import { Route, Routes } from "react-router-dom";
import "./App.css";

import SignInPage from "./Pages/SignInPage";
import DashboardPage from "./Pages/DashboardPage";
import NotFoundPage from "./Pages/NotFoundPage";
import Footer from "./Pages/Footer";

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
      <Footer />
    </div>
  );
}

export default App;
