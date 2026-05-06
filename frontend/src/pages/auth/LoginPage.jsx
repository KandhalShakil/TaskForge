import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layers, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { getApiErrorMessage } from '../../utils/apiError'
import Button from '../../components/common/Button'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    try {
      await login(data)
      toast.success('Welcome back!')
      navigate('/workspaces')
    } catch (err) {
      const detail = getApiErrorMessage(err, 'Invalid credentials')
      setError('root', { message: detail })
      toast.error(detail)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-y-auto no-scrollbar font-['Outfit']">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md"
        >
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-600 flex items-center justify-center shadow-2xl shadow-primary-500/20">
              <Layers size={24} className="text-white" />
            </div>
            <span className="text-3xl font-black text-white tracking-tight italic">TaskForge</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-slate-400 text-sm">Sign in to your professional workspace</p>
        </div>

        {/* Login Card */}
        <div className="card p-8 border-white/5 shadow-2xl bg-slate-900/40">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="label">Business Email</label>
              <div className="relative group">
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  className={`input group-hover:border-slate-700 transition-colors ${errors.email ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                  placeholder="name@company.com"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-red-400 text-[11px] mt-1.5 ml-1 font-medium">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="label">Password</label>
                <Link to="/forgot-password" className="text-[11px] text-primary-400 hover:text-primary-300 font-bold uppercase tracking-wider">Forgot password?</Link>
              </div>
              <div className="relative group">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input group-hover:border-slate-700 transition-colors pr-12 ${errors.password ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-[11px] mt-1.5 ml-1 font-medium">{errors.password.message}</p>}
            </div>

            {errors.root && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-red-400 text-xs font-medium space-y-3"
              >
                <p>{errors.root.message}</p>
                {errors.root.message.includes('scheduled for deletion') && (
                  <Link
                    to="/recover-account"
                    className="block w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-center transition-all font-bold uppercase tracking-widest text-[10px]"
                  >
                    Go to Recovery Page
                  </Link>
                )}
              </motion.div>
            )}

            <Button
              type="submit"
              id="login-submit"
              loading={isSubmitting}
              icon={ArrowRight}
              iconPosition="right"
              className="w-full h-12 text-base font-bold shadow-xl"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-400 text-sm">
              New to TaskForge?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-bold underline-offset-4 hover:underline transition-all">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
            Trusted by modern engineering teams
          </p>
        </div>
      </motion.div>
    </div>
  </div>
)
}
