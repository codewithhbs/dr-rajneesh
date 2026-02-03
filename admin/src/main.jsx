import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from "react-hot-toast";
import ErrorBoundary from './ErrorBoundary'
import ProtectedRoute from './lib/ProtectedRoute'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ErrorBoundary>
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
      <Toaster 
        position='top-center' 
        theme='system' 
        swipeDirection='right' 
        duration={1500} 
      />
    </ErrorBoundary>
  </BrowserRouter>
)