import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layers, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, Building2, UserCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { getApiErrorMessage } from '../../utils/apiError'
import axiosInstance from '../../api/axiosInstance'
import Button from '../../components/common/Button'

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
    clearErrors,
    watch,
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

  const companyName = watch('company_name')

  const validateCompany = async (name) => {
    if (!name || name.length < 2) return
    
    setIsValidating(true)
    const normalizedName = name.trim().split(/\s+/).join(' ')
    try {
      const { data } = await axiosInstance.get('/companies/check/', { params: { name: normalizedName } })
      setCompanyExists(data.exists)
      
      if (userType === 'employee' && !data.exists) {
        setError('company_name', { type: 'manual', message: 'Company does not exist' })
      } else if (userType === 'owner' && data.exists) {
        setError('company_name', { type: 'manual', message: 'Company name already taken' })
      } else {
        clearErrors('company_name')
      }
    } catch (error) {
      console.error('Company check failed', error)
    } finally {
      setIsValidating(false)
    }
  }

  // Real-time company validation
  useEffect(() => {
    const timer = setTimeout(() => {
      validateCompany(companyName)
    }, 600)
    
    if (!companyName || companyName.length < 2) {
      clearErrors('company_name')
      setCompanyExists(null)
      clearTimeout(timer)
      return
    }

    return () => clearTimeout(timer)
  }, [companyName, userType])

  const onSubmit = async (data) => {
    try {
      await registerUser({ ...data, user_type: userType })
      toast.success('Account created! Please verify your email.')
      navigate('/verify-email', { state: { email: data.email } })
    } catch (err) {
      const errorData = err.response?.data || {}
      if (errorData.email) setError('email', { message: Array.isArray(errorData.email) ? errorData.email[0] : errorData.email })
      if (errorData.password) setError('password', { message: Array.isArray(errorData.password) ? errorData.password[0] : errorData.password })
      if (errorData.non_field_errors) setError('root', { message: Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors })

      toast.error(getApiErrorMessage(err, 'Registration failed. Please check your details.'))
    }
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
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg"
        >
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-600 flex items-center justify-center shadow-2xl shadow-primary-500/20">
              <Layers size={20} className="text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight italic">TaskForge</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Join TaskForge</h1>
          <p className="text-slate-400 text-sm">Empower your team with professional task management</p>
        </div>

        {/* Register Card */}
        <div className="card p-8 border-white/5 shadow-2xl bg-slate-900/40">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Full Name</label>
                <div className="relative">
                  <input
                    id="register-name"
                    type="text"
                    autoComplete="name"
                    className={`input ${errors.full_name ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="John Doe"
                    {...register('full_name')}
                  />
                </div>
                {errors.full_name && <p className="text-red-400 text-[10px] mt-1 ml-1">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="label">Email Address</label>
                <div className="relative">
                  <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    className={`input ${errors.email ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="name@company.com"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-red-400 text-[10px] mt-1 ml-1">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Password</label>
                <div className="relative group">
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="Min. 8 characters"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-[10px] mt-1 ml-1">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <input
                    id="register-password2"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input ${errors.password2 ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="Repeat password"
                    {...register('password2')}
                  />
                </div>
                {errors.password2 && <p className="text-red-400 text-[10px] mt-1 ml-1">{errors.password2.message}</p>}
              </div>
            </div>

            {/* Account Type Selection */}
            <div className="space-y-3">
              <label className="label">I am joining as</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { setUserType('employee'); setCompanyExists(null) }}
                  className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                    userType === 'employee' ? 'border-primary-500 bg-primary-500/5' : 'border-white/5 bg-slate-900/50 hover:border-white/10'
                  }`}
                >
                  <UserCircle2 size={24} className={userType === 'employee' ? 'text-primary-400' : 'text-slate-600'} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${userType === 'employee' ? 'text-white' : 'text-slate-500'}`}>Employee</span>
                  {userType === 'employee' && <div className="absolute top-2 right-2"><CheckCircle2 size={12} className="text-primary-500" /></div>}
                </button>
                <button
                  type="button"
                  onClick={() => { setUserType('owner'); setCompanyExists(null) }}
                  className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                    userType === 'owner' ? 'border-primary-500 bg-primary-500/5' : 'border-white/5 bg-slate-900/50 hover:border-white/10'
                  }`}
                >
                  <Building2 size={24} className={userType === 'owner' ? 'text-primary-400' : 'text-slate-600'} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${userType === 'owner' ? 'text-white' : 'text-slate-500'}`}>Company Owner</span>
                  {userType === 'owner' && <div className="absolute top-2 right-2"><CheckCircle2 size={12} className="text-primary-500" /></div>}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Company Name</label>
              <div className="relative group">
                <input
                  id="register-company"
                  type="text"
                  className={`input ${
                    errors.company_name ? 'border-red-500 focus:ring-red-500/20' : 
                    (companyExists === true && !isValidating) ? 'border-green-500/50 focus:ring-green-500/10' : ''
                  }`}
                  placeholder={userType === 'owner' ? "Create a company name" : "Enter your company name"}
                  {...register('company_name')}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {isValidating && (
                    <Loader2 size={14} className="animate-spin text-primary-500" />
                  )}
                  {!isValidating && companyExists === true && userType === 'employee' && (
                    <CheckCircle2 size={16} className="text-green-500" />
                  )}
                  {!isValidating && companyExists === false && userType === 'employee' && (
                    <XCircle size={16} className="text-red-500" />
                  )}
                </div>
              </div>
              {errors.company_name && (
                <p className="text-red-400 text-[10px] mt-1 ml-1 font-medium flex items-center gap-1">
                  <XCircle size={12} /> {errors.company_name.message}
                </p>
              )}
              {!errors.company_name && companyExists === true && userType === 'employee' && !isValidating && (
                <p className="text-green-400 text-[10px] mt-1 ml-1 font-medium italic flex items-center gap-1">
                  <CheckCircle2 size={12} /> Perfect! We found your company workspace.
                </p>
              )}
            </div>

            {errors.root && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-red-400 text-xs font-medium">
                {errors.root.message}
              </div>
            )}

            <Button
              id="register-submit"
              type="submit"
              loading={isSubmitting}
              disabled={isValidating || (userType === 'employee' && companyExists === false) || (userType === 'owner' && companyExists === true)}
              icon={ArrowRight}
              iconPosition="right"
              className="w-full h-12 text-base font-bold shadow-xl"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-bold underline-offset-4 hover:underline transition-all">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
  )
}
