import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import { LogIn, Clock, Sparkles, Mail, AlertCircle, CheckCircle } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) throw error
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Google login failed!' })
      setLoading(false)
    }
  }

  const handleMagicLink = async (e) => {
    e.preventDefault()
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) throw error
      setMessage({
        type: 'success',
        text: 'Login link sent! Please check your Gmail inbox to verify and login.',
      })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Verification link failed!' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.15)] glow-pulse-emerald">
            <Clock className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Overtime Tracker
          </h1>
          <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" /> VIP Tracking Dashboard <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          </p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle line decoration */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 opacity-60"></div>

          <h2 className="text-2xl font-bold text-slate-100 mb-6 text-center">
            Welcome Back
          </h2>

          {message.text && (
            <div
              className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-sm ${
                message.type === 'error'
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              }`}
            >
              {message.type === 'error' ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Primary Action: Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 px-4 rounded-xl transition duration-200 shadow-[0_4px_12px_rgba(255,255,255,0.05)] disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.09 14.99 0 12 0 7.354 0 3.307 2.67 1.255 6.577l4.01 3.188z"
              />
              <path
                fill="#34A853"
                d="M16.04 15.345c-1.077.733-2.433 1.164-4.04 1.164-2.755 0-5.09-1.855-5.922-4.355l-4.01 3.109C4.12 19.99 7.78 23 12 23c2.92 0 5.617-.993 7.646-2.73l-3.606-2.925z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.275c0-.818-.08-1.609-.21-2.37H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.56l3.606 2.925c2.1-1.939 3.844-4.8 3.844-8.625z"
              />
              <path
                fill="#FBBC05"
                d="M6.078 12.155a6.995 6.995 0 0 1 0-2.39L2.068 6.577a11.96 11.96 0 0 0 0 10.84l4.01-3.262z"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <span className="relative px-3 bg-slate-900/90 text-xs text-slate-500 uppercase tracking-widest">
              Or Secure Gmail OTP
            </span>
          </div>

          {/* Email Magic Link Fallback */}
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Gmail Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 px-4 pl-11 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                  required
                />
                <Mail className="w-5 h-5 text-slate-600 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition duration-200 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Send Verification Magic Link
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Verify email address to automatically initialize your account profile.
          </p>
        </div>
      </div>
    </div>
  )
}
