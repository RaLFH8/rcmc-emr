const StatCard = ({ title, value, trend, icon: Icon, iconBg }) => {
  const isPositive = trend && !trend.includes('-')
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-semibold ${
            isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            <span className="text-[10px]">{isPositive ? '▲' : '▼'}</span>
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}

export default StatCard
