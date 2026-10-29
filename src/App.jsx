import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Loader from './components/Loader'
import Landing from './pages/Landing'

// Inner screens load on demand so the landing page ships a small bundle.
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Library = lazy(() => import('./pages/Library'))
const LiveWorkout = lazy(() => import('./pages/LiveWorkout'))
const Progress = lazy(() => import('./pages/Progress'))
const Classes = lazy(() => import('./pages/Classes'))
const Profile = lazy(() => import('./pages/Profile'))

const guard = (el) => <RequireAuth>{el}</RequireAuth>

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={guard(<Dashboard />)} />
          <Route path="/library" element={guard(<Library />)} />
          <Route path="/workout" element={guard(<LiveWorkout />)} />
          <Route path="/progress" element={guard(<Progress />)} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/profile" element={guard(<Profile />)} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
