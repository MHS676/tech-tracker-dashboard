import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { Users, Briefcase, Activity, CheckCircle } from 'lucide-react'
import StatCard from '../components/StatCard'
import { StatusBadge, TechStatusBadge } from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import Toast from '../components/Toast'

export default function Overview() {
  const { technicians, jobs, stats, loading, fetchAll } = useData()
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchAll().catch(err => {
      console.error('Error fetching data:', err)
      setToast({ message: err.message, type: 'error' })
    })
  }, [fetchAll])

  const recentJobs = jobs.slice(0, 5)
  const activeTechs = technicians.filter(t => t.status !== 'OFFLINE').slice(0, 5)

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '?'
  }

  if (loading && technicians.length === 0) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Technicians" value={stats.totalTechnicians} color="blue" />
        <StatCard icon={Briefcase} label="Total Jobs" value={stats.totalJobs} color="green" />
        <StatCard icon={Activity} label="Active Jobs" value={stats.activeJobs} color="orange" />
        <StatCard icon={CheckCircle} label="Completed" value={stats.completedJobs} color="purple" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Jobs */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
            <h3 className="font-semibold">Recent Jobs</h3>
            <Link to="/jobs" className="text-primary-400 text-sm font-medium hover:text-primary-300">
              View All
            </Link>
          </div>
          <div className="p-4">
            {recentJobs.length === 0 ? (
              <EmptyState icon={Briefcase} title="No jobs yet" description="Assign your first job to get started" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-dark-400 uppercase tracking-wider">
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Technician</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {recentJobs.map(job => (
                      <tr key={job.id} className="hover:bg-dark-700/50">
                        <td className="px-4 py-3 text-sm">{job.title}</td>
                        <td className="px-4 py-3 text-sm text-dark-400">
                          {job.technician?.name || 'Unassigned'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={job.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Active Technicians */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
            <h3 className="font-semibold">Active Technicians</h3>
            <Link to="/technicians" className="text-primary-400 text-sm font-medium hover:text-primary-300">
              View All
            </Link>
          </div>
          <div className="p-4">
            {activeTechs.length === 0 ? (
              <EmptyState icon={Users} title="No active technicians" description="Technicians will appear here when online" />
            ) : (
              <div className="space-y-3">
                {activeTechs.map(tech => (
                  <div key={tech.id} className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-sm font-medium">
                      {getInitials(tech.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{tech.name}</h4>
                      <p className="text-xs text-dark-400 truncate">{tech.email}</p>
                    </div>
                    <TechStatusBadge status={tech.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
