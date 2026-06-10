import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Save, User, Clock, LogOut } from 'lucide-react'

export default function Dashboard({ user }) {
  const [profile, setProfile] = useState({ full_name: '', employee_id: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [overtimeToday, setOvertimeToday] = useState(0)

  // Sirf 1 baar chalega. Koi loop nahi.
  useEffect(() => {
    fetchProfile()
    fetchTodayOvertime()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle() // <--.single() ki jagah.maybeSingle() use kar

      // Error ignore karo, bas data check karo
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          employee_id: data.employee_id || ''
        })
      }
    } catch (err) {
      console.log('No profile yet, thats ok')
    } finally {
      setLoading(false) // <-- Har haal me loading band karo
    }
  }

  const fetchTodayOvertime = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
    .from('overtime_logs')
    .select('duration_minutes')
    .eq('user_id', user.id)
    .eq('date', today)

    const total = data?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0
    setOvertimeToday(total)
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('user_profiles').upsert({
      user_id: user.id,
      email: user.email,
      full_name: profile.full_name,
      employee_id: profile.employee_id
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Details saved successfully!')
      fetchProfile() // Save ke baad dobara fetch kar
    }
    setSaving(false)
  }

  const formatMinutes = (minutes) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs}h ${mins}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-emerald-400" />
          <div>
            <p className="text-slate-400 text-xs uppercase font-bold">Today's Overtime</p>
            <p className="text-3xl font-black text-emerald-400">{formatMinutes(overtimeToday)}</p>
          </div>
        </div>
      </div>

      {/* Employee Details */}
      <div className="glass rounded-3xl p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          Employee Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm font-bold">Full Name</label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({...profile, full_name: e.target.value })}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100"
              placeholder="Ali Khan"
            />
          </div>

          <div>
            <label className="text-slate-400 text-sm font-bold">Employee ID</label>
            <input
              type="text"
              value={profile.employee_id}
              onChange={(e) => setProfile({...profile, employee_id: e.target.value })}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100"
              placeholder="EMP-001"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </div>
    </div>
  )
}
