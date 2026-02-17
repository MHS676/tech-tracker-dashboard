import { useEffect, useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { Plus, Briefcase, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { StatusBadge } from '../components/Badge'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function Jobs() {
  const { jobs, technicians, loading, error, fetchJobs, fetchTechnicians, assignJob } = useData()
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({ title: '', description: '', address: '', techId: '' })
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    Promise.all([fetchJobs(), fetchTechnicians()]).catch(err => {
      console.error('Error fetching data:', err)
      setToast({ message: err.message, type: 'error' })
    })
  }, [fetchJobs, fetchTechnicians])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await assignJob(formData.title, formData.description, formData.address, formData.techId, user.id)
      setShowModal(false)
      setFormData({ title: '', description: '', address: '', techId: '' })
      setToast({ message: 'Job assigned successfully', type: 'success' })
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Pagination
  const totalPages = Math.ceil(jobs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedJobs = jobs.slice(startIndex, endIndex)

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Assign Job
        </button>
      </div>

      <div className="card">
        {loading && jobs.length === 0 ? (
          <LoadingSpinner />
        ) : jobs.length === 0 ? (
          <EmptyState icon={Briefcase} title="No jobs found" description="Assign your first job to a technician" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700/50">
                <tr className="text-left text-xs text-dark-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Job</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Technician</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {paginatedJobs.map(job => (
                  <tr key={job.id} className="hover:bg-dark-700/30">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-xs text-dark-500 mt-0.5 line-clamp-1">{job.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-400 text-sm max-w-[200px] truncate">
                      {job.address}
                    </td>
                    <td className="px-6 py-4 text-dark-400">
                      {job.technician?.name || <span className="text-dark-500">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4 text-dark-400 text-sm">
                      {formatDate(job.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-dark-700 flex items-center justify-between">
                <div className="text-sm text-dark-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, jobs.length)} of {jobs.length} jobs
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded bg-dark-700 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1.5 rounded transition-colors ${
                        currentPage === page
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-700 hover:bg-dark-600'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded bg-dark-700 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Job Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Assign Job">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-400 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="Fix Network Issue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-400 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[100px] resize-none"
              placeholder="Describe the job..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-400 mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
              placeholder="123 Main St, City, State"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-400 mb-2">Assign to Technician</label>
            <select
              value={formData.techId}
              onChange={(e) => setFormData({ ...formData, techId: e.target.value })}
              className="input"
              required
            >
              <option value="">Select a technician...</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>
                  {tech.name} ({tech.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign Job'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
