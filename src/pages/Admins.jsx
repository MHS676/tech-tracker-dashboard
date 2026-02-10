import { useEffect, useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { Plus, Shield, Loader2 } from 'lucide-react'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function Admins() {
  const { admins, loading, error, fetchAdmins, createAdmin } = useData()
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAdmins().catch(err => {
      console.error('Error fetching admins:', err)
      setToast({ message: err.message, type: 'error' })
    })
  }, [fetchAdmins])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createAdmin(formData.name, formData.email, formData.password)
      setShowModal(false)
      setFormData({ name: '', email: '', password: '' })
      setToast({ message: 'Administrator added successfully', type: 'success' })
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '?'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Administrators</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      <div className="card">
        {loading && admins.length === 0 ? (
          <LoadingSpinner />
        ) : admins.length === 0 ? (
          <EmptyState icon={Shield} title="No administrators found" description="Add your first admin to get started" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700/50">
                <tr className="text-left text-xs text-dark-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Administrator</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Jobs Created</th>
                  <th className="px-6 py-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {admins.map(admin => (
                  <tr key={admin.id} className="hover:bg-dark-700/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {getInitials(admin.name)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{admin.name}</span>
                          {admin.id === user?.id && (
                            <span className="badge bg-green-500/15 text-green-500">You</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-400">{admin.email}</td>
                    <td className="px-6 py-4 text-dark-400">
                      {admin.jobs?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-dark-400 text-sm">
                      {formatDate(admin.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Administrator">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-400 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Jane Smith"
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
              placeholder="jane@example.com"
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
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Admin'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
