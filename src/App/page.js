export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Overtime Tracker</h1>
          <p className="text-gray-400 text-sm">VIP TRACKING DASHBOARD</p>
        </div>

        <h2 className="text-2xl font-semibold mb-2 text-white">Welcome Back</h2>
        <p className="text-gray-400 text-sm mb-6">Choose your login method</p>

        <div className="space-y-4">
          <button className="w-full gradient-btn text-white font-semibold py-3 rounded-xl">
            Magic Link
          </button>
          
          <div className="text-center text-gray-500 text-sm">or</div>
          
          <button className="w-full bg-slate-800 border border-slate-700 text-white font-semibold py-3 rounded-xl hover:bg-slate-700 transition">
            Password
          </button>
        </div>

        <div className="mt-6">
          <label className="text-sm text-gray-400 mb-2 block">GMAIL ADDRESS</label>
          <input 
            type="email" 
            placeholder="you@gmail.com"
            className="w-full input-dark text-white px-4 py-3 rounded-xl"
          />
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Developed by: Saad Mushtaq
        </p>
      </div>
    </main>
  )
}