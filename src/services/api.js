const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

class ApiService {
  get token() {
    return localStorage.getItem('auth_token')
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  setToken(token) {
    localStorage.setItem('auth_token', token)
  }

  clearToken() {
    localStorage.removeItem('auth_token')
  }

  // Auth
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Login failed')
    this.setToken(data.token)
    return data
  }

  async register(name, email, password) {
    const response = await fetch(`${API_BASE_URL}/admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Registration failed')
    this.setToken(data.token)
    return data
  }

  logout() {
    this.clearToken()
  }

  // Admins
  async getAllAdmins() {
    const response = await fetch(`${API_BASE_URL}/admin/all`, {
      headers: this.getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to fetch admins')
    return data.admins
  }

  async createAdmin(name, email, password) {
    const response = await fetch(`${API_BASE_URL}/admin/create-admin`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, email, password })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to create admin')
    return data.admin
  }

  async updateAdmin(id, name, email, password) {
    const response = await fetch(`${API_BASE_URL}/admin/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, email, password })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to update admin')
    return data.admin
  }

  async deleteAdmin(id) {
    const response = await fetch(`${API_BASE_URL}/admin/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to delete admin')
    return data
  }

  // Technicians
  async getAllTechnicians() {
    const response = await fetch(`${API_BASE_URL}/technician/all`, {
      headers: this.getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to fetch technicians')
    return data.technicians
  }

  async getTechnicianById(id) {
    const response = await fetch(`${API_BASE_URL}/technician/${id}`, {
      headers: this.getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to fetch technician')
    return data.technician
  }

  async createTechnician(name, email, password) {
    const response = await fetch(`${API_BASE_URL}/admin/create-technician`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, email, password })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to create technician')
    return data.technician
  }

  async updateTechnician(id, name, email, password) {
    const response = await fetch(`${API_BASE_URL}/admin/technician/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, email, password })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to update technician')
    return data.technician
  }

  async deleteTechnician(id) {
    const response = await fetch(`${API_BASE_URL}/admin/technician/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to delete technician')
    return data
  }

  // Jobs
  async getAllJobs() {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      headers: this.getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to fetch jobs')
    return data.jobs
  }

  async getJobById(id) {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      headers: this.getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to fetch job')
    return data.job
  }

  async assignJob(title, description, address, techId, adminId) {
    const response = await fetch(`${API_BASE_URL}/admin/assign-job`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title, description, address, techId, adminId })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to assign job')
    return data.job
  }

  // Location & Routes
  async getActiveRoutes() {
    const response = await fetch(`${API_BASE_URL}/routes/active`, {
      headers: this.getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to fetch routes')
    return data.routes
  }

  async getJobRoute(jobId) {
    const response = await fetch(`${API_BASE_URL}/routes/job/${jobId}`, {
      headers: this.getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to fetch job route')
    return data
  }

  async getTechniciansWithLocation() {
    const response = await fetch(`${API_BASE_URL}/technicians/locations`, {
      headers: this.getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to fetch technician locations')
    return data.technicians
  }

  async getLocationHistory(techId) {
    const response = await fetch(`${API_BASE_URL}/technician/${techId}/location-history`, {
      headers: this.getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to fetch location history')
    return data.locationHistory
  }

  // Health
  async healthCheck() {
    try {
      const response = await fetch('http://localhost:3000/health')
      return response.ok
    } catch {
      return false
    }
  }
}

export const api = new ApiService()
export default api
