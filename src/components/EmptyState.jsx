export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-700 mb-4">
        <Icon className="w-8 h-8 text-dark-400" />
      </div>
      <h4 className="text-lg font-medium text-dark-300 mb-1">{title}</h4>
      <p className="text-dark-500 text-sm">{description}</p>
    </div>
  )
}
