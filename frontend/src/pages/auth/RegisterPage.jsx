import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layers, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { getApiErrorMessage } from '../../utils/apiError'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password2: z.string(),
  company_name: z.string().min(2, 'Company name is required'),
}).refine((data) => data.password === data.password2, {
  message: 'Passwords must match',
  path: ['password2'],
})

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [userType, setUserType] = useState('employee')
  const [companyExists, setCompanyExists] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const navigate = useNavigate()
  const { register: registerUser } = useAuthStore()

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
      company_name: '',
    },
  })

  // Real-time company validation
  const validateCompany = async (name) => {
    if (!name || name.length < 2) {
      setCompanyExists(null)
      return
    }
    
    setIsValidating(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/companies/check/?name=${encodeURIComponent(name)}`)
      const data = await response.json()
      setCompanyExists(data.exists)
      
      if (userType === 'employee' && !data.exists) {
        setError('company_name', { type: 'manual', message: 'Company does not exist' })
      } else if (userType === 'owner' && data.exists) {
        setError('company_name', { type: 'manual', message: 'Company name already taken' })
      } else {
        setError('company_name', { type: 'manual', message: '' })
      }
    } catch (error) {
      console.error('Company check failed', error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleCompanyChange = (e) => {
    const value = e.target.value
    // Clear error while typing
    setError('company_name', { type: 'manual', message: '' })
    
    // Simple debounce
    const timeoutId = setTimeout(() => validateCompany(value), 500)
    return () => clearTimeout(timeoutId)
  }

  const onSubmit = async (data) => {
    try {
      await registerUser({ ...data, user_type: userType })
      toast.success('Account created! Welcome to TaskForge 🚀')
      navigate('/workspaces')
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
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
                    setUserType('employee')
                    setCompanyExists(null)
                  }}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    userType === 'employee'
                      ? 'border-primary-500 bg-primary-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">Employee</span>
                  <span className="text-[10px] opacity-70 text-center leading-tight">Join existing company</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserType('owner')
                    setCompanyExists(null)
                  }}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    userType === 'owner'
                      ? 'border-primary-500 bg-primary-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">Company Owner</span>
                  <span className="text-[10px] opacity-70 text-center leading-tight">Register your company</span>
                </button>
              </div>
            </div>

            <div>
              <label className="label">Company Name</label>
              <div className="relative">
                <input
                  id="register-company"
                  type="text"
                  className={`input ${errors.company_name ? 'border-red-500' : ''}`}
                  placeholder={userType === 'owner' ? "Your company name" : "Existing company name"}
                  {...register('company_name', { onChange: handleCompanyChange })}
                />
                {isValidating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={14} className="animate-spin text-primary-500" />
                  </div>
                )}
              </div>
              {errors.company_name && <p className="text-red-400 text-xs mt-1">{errors.company_name.message}</p>}
              {!errors.company_name && companyExists === true && userType === 'employee' && (
                <p className="text-green-400 text-[10px] mt-1 ml-1 flex items-center gap-1">
                  ✓ Company found
                </p>
              )}
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={isSubmitting || isValidating || (userType === 'employee' && companyExists === false) || (userType === 'owner' && companyExists === true)}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Creating account...</>
              ) : (
                'Create account'
              )}
            </button>
          </form>

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
