import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layers, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { authAPI } from '../../api/auth'
import { getApiErrorMessage } from '../../utils/apiError'
import Button from '../../components/common/Button'

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

export default function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    try {
      await authAPI.forgotPassword(data)
      setIsSent(true)
      toast.success('Reset link sent to your email')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to send reset link'))
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
          <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-slate-400 text-sm">We'll send you a recovery link shortly</p>
        </div>

        <div className="card p-8 border-white/5 shadow-2xl bg-slate-900/40">
          <AnimatePresence mode="wait">
            {!isSent ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit(onSubmit)} 
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="label">Verification Email</label>
                  <div className="relative group">
                    <input
                      type="email"
                      className={`input group-hover:border-slate-700 transition-colors ${errors.email ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                      placeholder="name@company.com"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-[11px] mt-1.5 ml-1 font-medium">{errors.email.message}</p>}
                </div>

                <Button
                  type="submit"
                  loading={isSubmitting}
                  icon={Mail}
                  iconPosition="right"
                  className="w-full h-12 text-base font-bold shadow-xl"
                >
                  Send Recovery Link
                </Button>

                <div className="text-center mt-6">
                  <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Sign In
                  </Link>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mx-auto mb-6 border border-green-500/20">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Check your inbox</h3>
                <p className="text-slate-400 text-sm mb-8">
                  We've sent a password reset link to your email. Please follow the instructions to secure your account.
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setIsSent(false)}
                  className="w-full"
                >
                  Didn't receive it? Try again
                </Button>
                <div className="mt-8 pt-8 border-t border-white/5">
                  <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 font-bold uppercase tracking-wider">
                    <ArrowLeft size={16} /> Return to Login
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      </div>
    </div>
  )
}
