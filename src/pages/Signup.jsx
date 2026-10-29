import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import AuthShell, { Field } from '../components/AuthShell'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Signup() {
  const { user, loading, signup } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', weeklyGoalWorkouts: 4, weeklyGoalMinutes: 150 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!loading && user) return <Navigate to="/dashboard" replace />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await signup(form)
      toast(`Account created. Your first workout is ready, ${u.full_name.split(' ')[0]}.`, { title: 'Welcome to PulseFit 🎉' })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set your weekly goals and we’ll plan the rest."
      footer={
        <>
          Already a member?{' '}
          <Link to="/login" className="font-semibold text-lime hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" autoComplete="name" required placeholder="Jordan Reyes" value={form.fullName} onChange={set('fullName')} />
        <Field label="Email" type="email" autoComplete="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} />
        <Field label="Password" type="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" value={form.password} onChange={set('password')} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Workouts / week" type="number" min={1} max={14} required value={form.weeklyGoalWorkouts} onChange={set('weeklyGoalWorkouts')} />
          <Field label="Active min / week" type="number" min={10} max={2000} step={10} required value={form.weeklyGoalMinutes} onChange={set('weeklyGoalMinutes')} />
        </div>
        {error && <p className="rounded-xl border border-magenta/30 bg-magenta/10 px-3 py-2 text-sm text-magenta">{error}</p>}
        <Button type="submit" className="w-full" size="lg" icon={Sparkles} disabled={busy}>
          {busy ? 'Creating account…' : 'Start training'}
        </Button>
      </form>
    </AuthShell>
  )
}
