import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import { Mail, LogIn, ShieldCheck, AlertCircle, Sparkles, User, Lock, KeyRound, UserPlus } from 'lucide-react'

export default function Auth() {
  const [mode, setMode] = useState('login') // 'login' ya 'signup'
  const [loginMethod, setLoginMethod] = useState('magic') // 'magic' ya 'password'
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address.' })
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Magic link sent! Check your email inbox and click the link to login.',
      })
      setEmail('')
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.error_description || error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (!username ||!password) {
      setMessage({ type: 'error', text: 'Username and password are required.' })
      return
    }

    try {
      setLoading(true)

      const loginEmail = `${username.toLowerCase()}@overtime.local`

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      })

      if (error) throw error

      // Login successful - App will redirect
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Invalid username or password.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (!username ||!password ||!fullName) {
      setMessage({ type: 'error', text: 'Username, password and full name are required.' })
      return
    }

    if (username.length < 3) {
      setMessage({ type: 'error', text: 'Username must be at least 3 characters.' })
      return
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }

    try {
      setLoading(true)

      const signupEmail = `${username.toLowerCase()}@overtime.local`

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: password,
        options: {
          data: {
            full_name: fullName,
            username: username.toLowerCase()
          }
        }
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setMessage({ type: 'error', text: 'This username is already taken.' })
        } else {
          setMessage({ type: 'error', text: signUpError.message })
        }
        return
      }

      // Save profile
      if (data.user) {
        const { error: profileError } = await supabase.from('user_profiles').insert({
          user_id: data.user.id,
          username: username.toLowerCase(),
          full_name: fullName,
          employee_id: null
        })

        if (profileError) {
          console.error('Profile error:', profileError)
        }
      }

      setMessage({
        type: 'success',
        text: 'Account created successfully! You can now login.',
      })

      // Switch to login mode
      setMode('login')
      setLoginMethod('password')
      setUsername('')
      setPassword('')
      setFullName('')
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to create account. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo + Heading */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block p-4 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-3xl border border-emerald-500/30 mb-6 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
            Overtime Tracker
          </h1>
          <p className="text-slate-500 text-sm font-semibold tracking-widest flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            VIP TRACKING DASHBOARD
            <Sparkles className="w-4 h-4 text-cyan-500" />
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl shadow-emerald-500/5 border border-slate-800/50 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>

          {/* Login/Signup Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-900/80 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setMessage({ type: '', text: '' })
              }}
              className={`flex-1 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                mode === 'login'
                 ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setMessage({ type: '', text: '' })
              }}
              className={`flex-1 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                mode === 'signup'
                 ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>

          <h2 className="text-2xl font-bold text-slate-100 text-center mb-2">
            {mode === 'login'? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-500 text-sm text-center mb-6">
            {mode === 'login'? 'Choose your login method' : 'Register with username'}
          </p>

          {/* Login Mode */}
          {mode === 'login' && (
            <>
              {/* Login Method Toggle */}
              <div className="flex gap-2 mb-6 p-1 bg-slate-900/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('magic')
                    setMessage({ type: '', text: '' })
                  }}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                    loginMethod === 'magic'
                     ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Magic Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('password')
                    setMessage({ type: '', text: '' })
                  }}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                    loginMethod === 'password'
                     ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  Password
                </button>
              </div>

              {loginMethod === 'magic'? (
                <form onSubmit={handleMagicLink} className="space-y-6">
                  <div>
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                      EMAIL ADDRESS
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3.5 px-4 pl-11 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition duration-200"
                        type="email"
                        placeholder="your.email@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <Mail className="w-5 h-5 text-slate-600 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-4 px-6 rounded-xl transition duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <LogIn className="w-5 h-5" />
                    )}
                    {loading? 'Sending Link...' : 'Send Verification Magic Link'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePasswordLogin} className="space-y-6">
                  <div>
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                      USERNAME
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3.5 px-4 pl-11 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition duration-200"
                        type="text"
                        placeholder="your_username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                      <User className="w-5 h-5 text-slate-600 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                      PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3.5 px-4 pl-11 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition duration-200"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Lock className="w-5 h-5 text-slate-600 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-4 px-6 rounded-xl transition duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <LogIn className="w-5 h-5" />
                    )}
                    {loading? 'Logging in...' : 'Login with Password'}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Signup Mode */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  USERNAME
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3.5 px-4 pl-11 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition duration-200"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <User className="w-5 h-5 text-slate-600 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  FULL NAME
                </label>
                <input
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3.5 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition duration-200"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3.5 px-4 pl-11 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition duration-200"
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock className="w-5 h-5 text-slate-600 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-4 px-6 rounded-xl transition duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <UserPlus className="w-5 h-5" />
                )}
                {loading? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {message.text && (
            <div
              className={`mt-6 p-4 rounded-xl text-sm flex items-start gap-2.5 ${
                message.type === 'error'
               ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{message.text}</span>
            </div>
          )}

          <p className="text-slate-600 text-xs text-center mt-8">
            {mode === 'login' && loginMethod === 'magic'
             ? 'Verify email address to automatically initialize your account profile.'
              : mode === 'login' && loginMethod === 'password'
             ? 'Use your username and password to login.'
              : 'Create account with username. No email verification needed.'}
          </p>
        </div>

        {/* Footer Credit */}
        <div className="text-center mt-8">
          <p className="text-slate-600 text-xs font-medium">
            Developed by: <span className="text-emerald-500 font-bold">Saad Mushtaq</span>
          </p>
        </div>
      </div>
    </div>
  )
}
