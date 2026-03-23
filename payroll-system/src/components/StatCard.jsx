const StatCard = ({ title, value, change, icon: Icon, gradient }) => {
  return (
    <div className="glass-card rounded-2xl p-6 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-gray-400 font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient} shadow-lg`}>
          <Icon size={24} className="text-white" strokeWidth={2} />
        </div>
      </div>
      {change && (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${change.startsWith('+') ? 'text-spectro-teal' : 'text-red-400'}`}>
            {change}
          </span>
          <span className="text-xs text-gray-500">vs last month</span>
        </div>
      )}
    </div>
  )
}

export default StatCard
