export default function StatCard({ icon: Icon, label, value, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-500/15 text-blue-500',
    green: 'bg-green-500/15 text-green-500',
    orange: 'bg-orange-500/15 text-orange-500',
    purple: 'bg-primary-500/15 text-primary-400',
  }

  return (
    <div className="card p-6 flex items-center gap-4 hover:translate-y-[-2px] transition-transform duration-200">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-3xl font-bold">{value}</h3>
        <p className="text-dark-400 text-sm">{label}</p>
      </div>
    </div>
  )
}
