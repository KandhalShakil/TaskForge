import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layers, ShieldCheck, Loader2, ArrowLeft, RefreshCw, MailCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { getApiErrorMessage } from '../../utils/apiError'
import Button from '../../components/common/Button'

const schema = z.object({
  otp: z.string().length(6, 'Verification code must be 6 digits'),
})

export default function VerifyEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const { verifyRegistration, resendOTP } = useAuthStore()
  const [resending, setResending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const stateEmail = location.state?.email
    if (!stateEmail) {
      toast.error('No email provided for verification')
      navigate('/register')
    } else {
      setEmail(stateEmail)
    }
  }, [location, navigate])

  const onSubmit = async (data) => {
    try {
      await verifyRegistration({ email, otp: data.otp })
      toast.success('Email verified! Welcome to TaskForge 🚀')
      navigate('/workspaces')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Verification failed. Please try again.'))
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await resendOTP(email)
      toast.success('New verification code sent!')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to resend code.'))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden font-['Outfit']">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-600 flex items-center justify-center shadow-2xl shadow-primary-500/20">
              <Layers size={24} className="text-white" />
            </div>
            <span className="text-3xl font-black text-white tracking-tight italic">TaskForge</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verify Security</h1>
          <p className="text-slate-400 text-sm">We've sent a 6-digit security code to</p>
          <p className="text-primary-400 font-bold mt-1">{email}</p>
        </div>

        <div className="card p-8 border-white/5 shadow-2xl bg-slate-900/40">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400 animate-pulse">
                  <MailCheck size={32} />
                </div>
              </div>
              
              <div className="space-y-2">
                <input
                  type="text"
                  maxLength={6}
                  className={`input text-center text-3xl font-black tracking-[0.4em] placeholder:tracking-normal placeholder:text-sm placeholder:font-medium h-16 ${
                    errors.otp ? 'border-red-500' : 'border-white/5'
                  }`}
                  placeholder="000000"
                  {...register('otp')}
                />
                {errors.otp && <p className="text-red-400 text-[11px] text-center mt-2 font-medium">{errors.otp.message}</p>}
              </div>
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full h-12 text-base font-bold shadow-xl"
              icon={ShieldCheck}
            >
              Verify Identity
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest"
            >
              {resending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Resend Security Code
            </button>

            <Link
              to="/register"
              className="text-[11px] text-slate-600 hover:text-slate-400 font-bold uppercase tracking-[0.1em] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Sign Up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
