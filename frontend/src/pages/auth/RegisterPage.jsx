import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layers, Eye, EyeOff, Loader2, Mail, ArrowLeft, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { useEffect } from 'react'
import { getApiErrorMessage } from '../../utils/apiError'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password2: z.string(),
}).refine((data) => data.password === data.password2, {
  message: 'Passwords must match',
  path: ['password2'],
})

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Details, 2: OTP
  const [otpEmail, setOtpEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [timer, setTimer] = useState(0)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    password2: '',
    user_type: 'employee'
  })
  
  const { register: registerUser, verifyRegistration, resendOTP } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({ 
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      password2: '',
      user_type: 'employee',
    }
  })

  useEffect(() => {
    let interval = null
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    } else if (interval) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [timer])

  const onSubmit = async (data) => {
    try {
      const response = await registerUser({ ...data, user_type: formData.user_type })
      setOtpEmail(data.email)
      setStep(2)
      setTimer(60) // 1 minute resend timer
      toast.success(response.message || 'OTP sent to your email!')
    } catch (err) {
      const errorData = err.response?.data || {}
      const emailMessage = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email
      const passwordMessage = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password
      const nonFieldMessage = Array.isArray(errorData.non_field_errors)
        ? errorData.non_field_errors[0]
        : errorData.non_field_errors

      if (emailMessage) setError('email', { message: emailMessage })
      if (passwordMessage) setError('password', { message: passwordMessage })
      if (nonFieldMessage) setError('root', { message: nonFieldMessage })

      toast.error(getApiErrorMessage(err, 'Registration failed. Please check your details.'))
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit code.')
      return
    }

    try {
      await verifyRegistration({ email: otpEmail, otp })
      toast.success('Account verified! Welcome to TaskForge 🚀')
      navigate('/workspaces')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Verification failed. Please check the code.'))
    }
  }

  const handleResend = async () => {
    if (timer > 0) return
    setIsResending(true)
    try {
      await resendOTP(otpEmail)
      setTimer(60)
      toast.success('New code sent to your email!')
    } catch (err) {
      toast.error('Failed to resend code.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-900/30">
              <Layers size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">TaskForge</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm">Start managing projects for free</p>
        </div>

        <div className="card p-8 shadow-2xl shadow-black/40">
          {step === 1 ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Full name</label>
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  defaultValue=""
                  className={`input ${errors.full_name ? 'border-red-500' : ''}`}
                  placeholder="John Doe"
                  {...register('full_name')}
                />
                {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
              </div>

              <div>
                <label className="label">Email address</label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  defaultValue=""
                  className={`input ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="you@company.com"
                  {...register('email')}
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    defaultValue=""
                    className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Min. 8 characters"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="label">Confirm password</label>
                <input
                  id="register-password2"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  defaultValue=""
                  className={`input ${errors.password2 ? 'border-red-500' : ''}`}
                  placeholder="Repeat your password"
                  {...register('password2')}
                />
                {errors.password2 && <p className="text-red-400 text-xs mt-1">{errors.password2.message}</p>}
              </div>

              {errors.root && (
                <div className="bg-red-950/50 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
                  {errors.root.message}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((current) => ({ ...current, user_type: 'employee' }))
                    }}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.user_type === 'employee' 
                        ? 'border-primary-500 bg-primary-500/10 text-white' 
                        : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">Employee</span>
                    <span className="text-[10px] opacity-70 text-center leading-tight">Join existing workspaces</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((current) => ({ ...current, user_type: 'company' }))
                    }}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.user_type === 'company' 
                        ? 'border-primary-500 bg-primary-500/10 text-white' 
                        : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">Company</span>
                    <span className="text-[10px] opacity-70 text-center leading-tight">Create & manage workspaces</span>
                  </button>
                </div>
              </div>

              <button
                id="register-submit"
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full justify-center py-2.5 mt-2"
              >
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Sending OTP...</> : 'Create account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="text-primary-400" size={32} />
                </div>
                <p className="text-slate-300 text-sm mb-1">We've sent a 6-digit code to</p>
                <p className="text-white font-medium mb-6">{otpEmail}</p>
              </div>

              <div>
                <label className="label text-center">Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoComplete="one-time-code"
                  className="input text-center text-3xl tracking-[1em] font-bold py-4 placeholder:tracking-normal placeholder:text-slate-700"
                  placeholder="000000"
                />
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={otp.length !== 6}
                  className="btn-primary w-full justify-center py-3"
                >
                  Verify & Create Account
                </button>
                
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-400 hover:text-white text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={timer > 0 || isResending}
                    className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isResending ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : timer > 0 ? (
                      `Resend in ${timer}s`
                    ) : (
                      'Resend Code'
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
