import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import NewFolio from './pages/NewFolio'
import FolioDetail from './pages/FolioDetail'
import NewCurio from './pages/NewCurio'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/folios/new" element={
            <ProtectedRoute><NewFolio /></ProtectedRoute>
          } />
          <Route path="/folios/:id" element={
            <ProtectedRoute><FolioDetail /></ProtectedRoute>
          } />
          <Route path="/folios/:id/curios/new" element={
            <ProtectedRoute><NewCurio /></ProtectedRoute>
          } />
          <Route path="/exhibits/:id" element={
            <ProtectedRoute><div>Exhibit detail coming soon</div></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App