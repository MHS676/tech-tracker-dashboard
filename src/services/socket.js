import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

class SocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
  }

  connect() {
    if (this.socket?.connected) return this.socket

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    })

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id)
      // Join admin room to receive location updates
      this.socket.emit('joinAdmin')
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Request all current technician locations
  requestAllLocations() {
    if (this.socket?.connected) {
      this.socket.emit('requestAllLocations')
    }
  }

  // Request active routes
  requestActiveRoutes() {
    if (this.socket?.connected) {
      this.socket.emit('requestActiveRoutes')
    }
  }

  // Request location history for a technician
  requestHistory(techId) {
    if (this.socket?.connected) {
      this.socket.emit('requestHistory', techId)
    }
  }

  // Request route for a specific job
  requestJobRoute(jobId) {
    if (this.socket?.connected) {
      this.socket.emit('requestJobRoute', jobId)
    }
  }

  // Listen for location updates
  onLocationUpdate(callback) {
    if (this.socket) {
      this.socket.on('locationUpdate', callback)
    }
  }

  // Listen for all locations response
  onAllLocations(callback) {
    if (this.socket) {
      this.socket.on('allLocations', callback)
    }
  }

  // Listen for active routes
  onActiveRoutes(callback) {
    if (this.socket) {
      this.socket.on('activeRoutes', callback)
    }
  }

  // Listen for route started
  onRouteStarted(callback) {
    if (this.socket) {
      this.socket.on('routeStarted', callback)
    }
  }

  // Listen for route completed
  onRouteCompleted(callback) {
    if (this.socket) {
      this.socket.on('routeCompleted', callback)
    }
  }

  // Listen for location history
  onLocationHistory(callback) {
    if (this.socket) {
      this.socket.on('locationHistory', callback)
    }
  }

  // Listen for job route
  onJobRoute(callback) {
    if (this.socket) {
      this.socket.on('jobRoute', callback)
    }
  }

  // Request all technicians (with or without GPS)
  requestAllTechnicians() {
    if (this.socket?.connected) {
      this.socket.emit('requestAllTechnicians')
    }
  }

  // Listen for all technicians response
  onAllTechnicians(callback) {
    if (this.socket) {
      this.socket.on('allTechnicians', callback)
    }
  }

  // Listen for GPS status changes
  onTechGPSChanged(callback) {
    if (this.socket) {
      this.socket.on('techGPSChanged', callback)
    }
  }

  // Remove listener
  off(event) {
    if (this.socket) {
      this.socket.off(event)
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners()
    }
  }
}

export const socketService = new SocketService()
export default socketService
