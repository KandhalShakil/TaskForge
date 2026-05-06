import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Layers, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { getApiErrorMessage } from '../../utils/apiError'

export default function RecoverAccountPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { recoverAccountToken } = useAuthStore()
  const [status, setStatus] = useState('processing') // processing, success, error
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setError('Recovery token is missing.')
      return
    }

    const performRecovery = async () => {
      try {
        await recoverAccountToken(token)
        setStatus('success')
        toast.success('Account successfully recovered! Welcome back.')
      } catch (err) {
        setStatus('error')
        setError(getApiErrorMessage(err, 'Failed to recover account. The link may be expired or invalid.'))
      }
    }

    performRecovery()
  }, [searchParams, recoverAccountToken])

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-900/30">
              <Layers size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">TaskForge</span>
          </div>
        </div>

        <div className="card p-8 shadow-2xl shadow-black/40 border-primary-500/10 text-center">
          {status === 'processing' && (
            <div className="py-10">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Restoring Account</h2>
              <p className="text-slate-400">Please wait while we re-activate your profile...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-6">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
              <p className="text-slate-400 mb-8">
                Your account has been successfully restored. All your data is exactly where you left it.
              </p>
              <button
                onClick={() => navigate('/workspaces')}
                className="btn-primary w-full justify-center py-3 group"
              >
                Go to Dashboard
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="py-6">
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Recovery Failed</h2>
              <p className="text-red-400/80 mb-8 font-medium">
                {error}
              </p>
              <Link
                to="/login"
                className="btn-secondary w-full justify-center py-3"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
