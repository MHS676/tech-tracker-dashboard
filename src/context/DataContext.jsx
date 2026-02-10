import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [technicians, setTechnicians] = useState([])
  const [jobs, setJobs] = useState([])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTechnicians = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getAllTechnicians()
      setTechnicians(data)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getAllJobs()
      setJobs(data)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getAllAdmins()
      setAdmins(data)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [techData, jobsData, adminsData] = await Promise.all([
        api.getAllTechnicians(),
        api.getAllJobs(),
        api.getAllAdmins()
      ])
      setTechnicians(techData)
      setJobs(jobsData)
      setAdmins(adminsData)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createTechnician = async (name, email, password) => {
    const tech = await api.createTechnician(name, email, password)
    setTechnicians(prev => [...prev, tech])
    return tech
  }

  const createAdmin = async (name, email, password) => {
    const admin = await api.createAdmin(name, email, password)
    setAdmins(prev => [...prev, admin])
    return admin
  }

  const assignJob = async (title, description, address, techId, adminId) => {
    const job = await api.assignJob(title, description, address, techId, adminId)
    setJobs(prev => [job, ...prev])
    return job
  }

  // Stats
  const stats = {
    totalTechnicians: technicians.length,
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(j.status)).length,
    completedJobs: jobs.filter(j => j.status === 'COMPLETED').length,
    onlineTechnicians: technicians.filter(t => t.status !== 'OFFLINE').length
  }

  return (
    <DataContext.Provider value={{
      technicians,
      jobs,
      admins,
      loading,
      error,
      stats,
      fetchTechnicians,
      fetchJobs,
      fetchAdmins,
      fetchAll,
      createTechnician,
      createAdmin,
      assignJob
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
