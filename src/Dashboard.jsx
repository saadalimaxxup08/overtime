import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import confetti from 'canvas-confetti'
import { 
  Clock, Play, Square, Activity, Calendar, MapPin, 
  TrendingUp, MessageSquare, AlertCircle, Sparkles, CheckCircle2 
} from 'lucide-react'

export default function Dashboard({ user }) {
  const [activeSession, setActiveSession] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [todayTotal, setTodayTotal] = useState(0)
  const [timezone, setTimezone] = useState('')
  const [localTime, setLocalTime] = useState('')
  
  // Checking-out state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [checkoutDescription, setCheckoutDescription] = useState('')
  
  // Loading & error states
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Live timer states
  const [elapsedTime, setElapsedTime] = useState('00:00:00')
  const timerRef = useRef(null)

  // Auto-timezone and local clock
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    setTimezone(tz)

    const updateClock = () => {
      const options = {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }
      setLocalTime(new Date().toLocaleTimeString('en-US', options))
    }

    updateClock()
    const clockInterval = setInterval(updateClock, 1000)
    return () => clearInterval(clockInterval)
  }, [])

  // Initial data loading
  useEffect(() => {
    fetchDashboardData()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [user])

  // Track elapsed time when activeSession updates
  useEffect(() => {
    if (activeSession) {
      if (timerRef.current) clearInterval(timerRef.current)
      
      const calculateElapsed = () => {
        const start = new Date(activeSession.check_in_time)
        const now = new Date()
        const diffMs = now - start
        
        if (diffMs < 0) {
          setElapsedTime('00:00:00')
          return
        }

        const secs = Math.floor((diffMs / 1000) % 60)
        const mins = Math.floor((diffMs / (1000 * 60)) % 60)
        const hrs = Math.floor(diffMs / (1000 * 60 * 60))

        const pad = (num) => String(num).padStart(2, '0')
        setElapsedTime(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`)
      }

      calculateElapsed()
      timerRef.current = setInterval(calculateElapsed, 1000)
    } else {
      setElapsedTime('00:00:00')
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeSession])

  const getLocalDateString = () => {
    // Returns YYYY-MM-DD in local timezone
    const offset = new Date().getTimezoneOffset()
    const local = new Date(new Date().getTime() - offset * 60 * 1000)
    return local.toISOString().split('T')[0]
  }

  const fetchDashboardData = async () => {
    if (!user) return
    setLoading(true)
    setErrorMsg('')
    try {
      // 1. Fetch active session (check_out_time is null)
      const { data: active, error: activeErr } = await supabase
        .from('overtime_logs')
        .select('*')
        .eq('user_id', user.id)
        .is('check_out_time', null)
        .maybeSingle()

      if (activeErr) throw activeErr
      setActiveSession(active)

      // 2. Fetch last 7 logs
      const { data: history, error: historyErr } = await supabase
        .from('overtime_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('check_in_time', { ascending: false })
        .limit(7)

      if (historyErr) throw historyErr
      setRecentLogs(history || [])

      // 3. Calculate today's total (sum of duration_minutes where date is today)
      const todayDateStr = getLocalDateString()
      const { data: todayLogs, error: todayErr } = await supabase
        .from('overtime_logs')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .eq('date', todayDateStr)

      if (todayErr) throw todayErr
      
      const totalMins = todayLogs.reduce((acc, log) => acc + (log.duration_minutes || 0), 0)
      setTodayTotal(totalMins)

    } catch (err) {
      console.error(err)
      setErrorMsg('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!user) return
    setActionLoading(true)
    setErrorMsg('')
    
    const now = new Date()
    const checkInTime = now.toISOString()
    const dateString = getLocalDateString()

    try {
      const { data, error } = await supabase
        .from('overtime_logs')
        .insert([{
          user_id: user.id,
          check_in_time: checkInTime,
          date: dateString,
          timezone: timezone,
        }])
        .select()
        .single()

      if (error) throw error
      setActiveSession(data)
      
      // Update recent list and stats
      fetchDashboardData()
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message || 'Check-in failed. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOutPrompt = () => {
    setCheckoutDescription('')
    setShowCheckoutModal(true)
  }

  const handleCheckOutSubmit = async (e) => {
    e.preventDefault()
    if (!activeSession) return
    setActionLoading(true)
    setErrorMsg('')

    const checkOutTime = new Date()
    const checkInTime = new Date(activeSession.check_in_time)
    
    // Calculate difference in minutes
    const diffMs = checkOutTime - checkInTime
    const durationMinutes = Math.max(0, Math.round(diffMs / 60000))

    try {
      const { error } = await supabase
        .from('overtime_logs')
        .update({
          check_out_time: checkOutTime.toISOString(),
          duration_minutes: durationMinutes,
          description: checkoutDescription.trim() || 'No description provided'
        })
        .eq('id', activeSession.id)

      if (error) throw error
      
      // Confetti effect!
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      })

      setActiveSession(null)
      setShowCheckoutModal(false)
      fetchDashboardData()
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message || 'Check-out failed. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const formatMinutes = (minutes) => {
    if (!minutes) return '0m'
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner with Clock & Location */}
      <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none"></div>
        
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-300">
            Welcome back,
          </h1>
          <p className="text-emerald-400 font-semibold text-sm md:text-base mt-1 tracking-wide uppercase">
            {user.email}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-400 mt-3">
            <span className="flex items-center gap-1 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <MapPin className="w-4 h-4 text-emerald-400" />
              {timezone || 'Detecting Location...'}
            </span>
            <span className="flex items-center gap-1 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <Calendar className="w-4 h-4 text-cyan-400" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Live Local Clock */}
        <div className="bg-slate-900/90 border border-slate-800 px-6 py-4 rounded-2xl flex flex-col items-center justify-center md:min-w-[180px] shadow-inner">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">Local Time</span>
          <span className="text-2xl md:text-3xl font-extrabold text-slate-100 font-mono tracking-wider">
            {localTime || '--:--:--'}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Tracking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tracking Controller */}
        <div className="lg:col-span-2 glass rounded-3xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden min-h-[320px]">
          {activeSession ? (
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
          ) : null}
          
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tracking Status</span>
              <div className="flex items-center gap-2.5 mt-2">
                <span className={`w-3 h-3 rounded-full ${activeSession ? 'bg-emerald-500 animate-ping' : 'bg-slate-700'}`}></span>
                <h2 className="text-xl font-bold text-slate-100">
                  {activeSession ? 'Tracking Active Session' : 'Ready to Check In'}
                </h2>
              </div>
            </div>
            
            {activeSession && (
              <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> LIVE
              </span>
            )}
          </div>

          {/* Live Timer Counter */}
          <div className="my-8 text-center">
            {activeSession ? (
              <div className="space-y-2">
                <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-mono tracking-widest drop-shadow-[0_4px_10px_rgba(16,185,129,0.1)]">
                  {elapsedTime}
                </div>
                <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
                  Started Check-in: {new Date(activeSession.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ) : (
              <div className="text-slate-600 text-sm italic py-4">
                Click checkout to automatically record total minutes to your history logs.
              </div>
            )}
          </div>

          {/* Tracking Buttons */}
          <div className="flex gap-4">
            {!activeSession ? (
              <button
                onClick={handleCheckIn}
                disabled={loading || actionLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-4 px-6 rounded-2xl transition duration-300 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 disabled:opacity-50 text-base md:text-lg"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                Check-In Now
              </button>
            ) : (
              <button
                onClick={handleCheckOutPrompt}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold py-4 px-6 rounded-2xl transition duration-300 shadow-lg shadow-red-500/10 hover:shadow-red-500/20 disabled:opacity-50 text-base md:text-lg"
              >
                <Square className="w-5 h-5 fill-white" />
                Check-Out & Close Session
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Stats Panel */}
        <div className="space-y-6">
          {/* Stats Card: Today Total */}
          <div className="glass rounded-3xl p-6 md:p-8 flex flex-col justify-between h-[150px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Today's Total Overtime</span>
              <div className="text-3xl font-black text-cyan-400 mt-2 font-mono">
                {formatMinutes(todayTotal)}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Calculated based on today's logs</span>
            </div>
          </div>

          {/* Stats Card: Info Card */}
          <div className="glass rounded-3xl p-6 md:p-8 flex flex-col justify-between h-[150px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Calendar Integrity</span>
              <p className="text-sm text-slate-300 mt-2 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                No Missing Days Active
              </p>
            </div>
            <div className="text-slate-500 text-xs border-t border-slate-800/80 pt-3">
              Empty days are automatically padded in report views.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="glass rounded-3xl p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Recent Logs (Last 7 Sessions)
          </h2>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 italic text-sm">
            No overtime logged in the past 7 sessions. Start tracking now!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-bold">Date</th>
                  <th className="pb-3 font-bold">Check-In</th>
                  <th className="pb-3 font-bold">Check-Out</th>
                  <th className="pb-3 font-bold text-right">Duration</th>
                  <th className="pb-3 font-bold pl-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 font-semibold text-slate-200">
                      {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 text-slate-400 font-mono">
                      {new Date(log.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 text-slate-400 font-mono">
                      {log.check_out_time ? (
                        new Date(log.check_out_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      ) : (
                        <span className="text-emerald-400 font-semibold animate-pulse text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">ACTIVE</span>
                      )}
                    </td>
                    <td className="py-4 text-slate-100 font-bold font-mono text-right">
                      {log.duration_minutes ? formatMinutes(log.duration_minutes) : '--'}
                    </td>
                    <td className="py-4 pl-4 max-w-[200px] truncate text-slate-400" title={log.description}>
                      {log.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Checkout Modal (Prompting for description) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass rounded-3xl max-w-md w-full p-6 md:p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
            
            <h3 className="text-2xl font-bold text-slate-100 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              Checkout Details
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Please write a brief description of what you worked on or where this overtime took place.
            </p>

            <form onSubmit={handleCheckOutSubmit} className="space-y-5">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  Description / Task Completed
                </label>
                <textarea
                  value={checkoutDescription}
                  onChange={(e) => setCheckoutDescription(e.target.value)}
                  placeholder="e.g. Server maintenance, database migration, or client meeting..."
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200 h-28 resize-none"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-300 font-semibold py-3 rounded-xl border border-slate-800 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition duration-200 shadow-md shadow-emerald-500/10"
                >
                  {actionLoading ? 'Closing...' : 'Close Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
