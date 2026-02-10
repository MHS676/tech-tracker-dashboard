import { useEffect, useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Users, Loader2 } from 'lucide-react'
import { TechStatusBadge, TrackingBadge } from '../components/Badge'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function Technicians() {
  const { technicians, loading, error, fetchTechnicians, createTechnician } = useData()
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTechnicians().catch(err => {
      console.error('Error fetching technicians:', err)
      setToast({ message: err.message, type: 'error' })
    })
  }, [fetchTechnicians])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createTechnician(formData.name, formData.email, formData.password)
      setShowModal(false)
      setFormData({ name: '', email: '', password: '' })
      setToast({ message: 'Technician added successfully', type: 'success' })
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '?'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Technicians</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Add Technician
        </button>
      </div>

      <div className="card">
        {loading && technicians.length === 0 ? (
          <LoadingSpinner />
        ) : technicians.length === 0 ? (
          <EmptyState icon={Users} title="No technicians found" description="Add your first technician to get started" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700/50">
                <tr className="text-left text-xs text-dark-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Technician</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tracking</th>
                  <th className="px-6 py-4">Jobs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {technicians.map(tech => (
                  <tr key={tech.id} className="hover:bg-dark-700/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-sm font-medium">
                          {getInitials(tech.name)}
                        </div>
                        <span className="font-medium">{tech.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-400">{tech.email}</td>
                    <td className="px-6 py-4">
                      <TechStatusBadge status={tech.status} />
                    </td>
                    <td className="px-6 py-4">
                      <TrackingBadge isTracking={tech.isTracking} />
                    </td>
                    <td className="px-6 py-4 text-dark-400">
                      {tech.jobs?.length || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Technician Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Technician">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-400 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-400 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              placeholder="john@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-400 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Technician'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
