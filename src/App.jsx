import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentDetail from './pages/StudentDetail'
import StudentPortal from './pages/StudentPortal'
import Kanban from './pages/Kanban'
import Calendar from './pages/Calendar'
import Resources from './pages/Resources'
import Compta from './pages/admin/Compta'
import Sales from './pages/admin/Sales'
import Contenu from './pages/admin/Contenu'
import Feedbacks from './pages/Feedbacks'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-dark">
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-dark">
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Route publique — portail élève sans auth */}
      <Route path="/s/:token" element={<StudentPortal />} />

      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentDetail />} />
        <Route path="kanban" element={<Kanban />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="resources" element={<Resources />} />
        <Route path="feedbacks" element={<Feedbacks />} />
        <Route path="admin/compta" element={<Compta />} />
        <Route path="admin/sales" element={<Sales />} />
        <Route path="admin/contenu" element={<Contenu />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
