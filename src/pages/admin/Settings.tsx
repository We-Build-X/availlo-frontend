export default function AdminSettings() {
  const username = localStorage.getItem("availlo_user") || "Admin User"

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 pt-4 sm:pt-8 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 mb-1 sm:mb-2">
          Settings
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500">
          Manage your admin account and preferences.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-xl">
        <h2 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">
          Account
        </h2>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Signed in as</span>
          <span className="font-bold text-slate-900">{username}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-xl">
        <p className="text-sm text-slate-500">
          More settings options are coming soon.
        </p>
      </div>
    </div>
  )
}
