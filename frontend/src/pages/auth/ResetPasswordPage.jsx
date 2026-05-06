import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layers, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { authAPI } from '../../api/auth'
import { getApiErrorMessage } from '../../utils/apiError'
import Button from '../../components/common/Button'

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password2: z.string(),
}).refine((data) => data.password === data.password2, {
  message: 'Passwords must match',
  path: ['password2'],
})

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    if (!token || !email) {
      toast.error('Invalid or expired reset link')
      return
    }

    try {
      await authAPI.resetPassword({
        email,
        otp: token, // The 'token' from URL is being used as the OTP
        password: data.password,
        password2: data.password2 || data.password // Backend expects both
      })
      setIsSuccess(true)
      toast.success('Password updated successfully!')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to reset password'))
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative font-['Outfit']">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md card p-10 text-center border-white/5 shadow-2xl bg-slate-900/40"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mx-auto mb-8 border border-green-500/20">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Security Updated</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Your password has been successfully reset. You will be redirected to the login page momentarily.
          </p>
          <Link to="/login" className="text-primary-400 font-bold uppercase tracking-widest text-xs hover:text-primary-300">
            Go to Login Now
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-y-auto no-scrollbar font-['Outfit']">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md"
        >
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-600 flex items-center justify-center">
              <Layers size={24} className="text-white" />
            </div>
            <span className="text-3xl font-black text-white tracking-tight italic">TaskForge</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Create New Password</h1>
          <p className="text-slate-400 text-sm italic opacity-60">Security Protocol Phase 2</p>
        </div>

        <div className="card p-8 border-white/5 shadow-2xl bg-slate-900/40">
          {!token || !email ? (
            <div className="text-center py-6">
              <p className="text-rose-400 font-bold mb-6">INVALID RESET TOKEN</p>
              <p className="text-slate-500 text-xs mb-8">This link is either broken or has expired. Please request a new recovery link.</p>
              <Link to="/forgot-password">
                <Button variant="primary" className="w-full">Request New Link</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="label">New Security Key</label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`input pr-12 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Min. 8 characters"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-[10px] mt-1 ml-1">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="label">Confirm Security Key</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input ${errors.password2 ? 'border-red-500' : ''}`}
                  placeholder="Repeat new password"
                  {...register('password2')}
                />
                {errors.password2 && <p className="text-red-400 text-[10px] mt-1 ml-1">{errors.password2.message}</p>}
              </div>

              <Button
                type="submit"
                loading={isSubmitting}
                icon={Lock}
                iconPosition="right"
                className="w-full h-12 text-base font-bold shadow-xl"
              >
                Update Credentials
              </Button>
            </form>
          )}
        </div>
      </motion.div>
      </div>
    </div>
  )
}
