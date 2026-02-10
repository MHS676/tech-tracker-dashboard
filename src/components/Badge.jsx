export function StatusBadge({ status }) {
  const styles = {
    PENDING: 'bg-yellow-500/15 text-yellow-500',
    ASSIGNED: 'bg-blue-500/15 text-blue-500',
    ACCEPTED: 'bg-primary-500/15 text-primary-400',
    IN_PROGRESS: 'bg-orange-500/15 text-orange-500',
    COMPLETED: 'bg-green-500/15 text-green-500',
    CANCELLED: 'bg-red-500/15 text-red-500',
  }

  const labels = {
    PENDING: 'Pending',
    ASSIGNED: 'Assigned',
    ACCEPTED: 'Accepted',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  }

  return (
    <span className={`badge ${styles[status] || 'bg-dark-600 text-dark-300'}`}>
      {labels[status] || status}
    </span>
  )
}

export function TechStatusBadge({ status }) {
  const styles = {
    ONLINE: 'bg-green-500/15 text-green-500',
    OFFLINE: 'bg-dark-600 text-dark-400',
    ON_WAY: 'bg-orange-500/15 text-orange-500',
    ON_SITE: 'bg-primary-500/15 text-primary-400',
  }

  const labels = {
    ONLINE: 'Online',
    OFFLINE: 'Offline',
    ON_WAY: 'On Way',
    ON_SITE: 'On Site',
  }

  return (
    <span className={`badge ${styles[status] || 'bg-dark-600 text-dark-300'}`}>
      {labels[status] || status}
    </span>
  )
}

export function TrackingBadge({ isTracking }) {
  return (
    <span className={`badge ${isTracking ? 'bg-green-500/15 text-green-500' : 'bg-dark-600 text-dark-400'}`}>
      {isTracking ? 'Active' : 'Inactive'}
    </span>
  )
}
