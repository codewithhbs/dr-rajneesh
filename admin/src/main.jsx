import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/authContext'
import ErrorBoundary from './ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>

    <AuthProvider>
      <ErrorBoundary>


      <App />
      </ErrorBoundary>
    </AuthProvider>

    <Toaster position='top-center' theme={'system'} swipeDirections={'right'} duration={1500} />

  </BrowserRouter>

)
