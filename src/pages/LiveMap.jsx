import React, { useEffect, useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Navigation, Users, Activity, RefreshCw, Eye, X, Clock, CheckCircle, Search } from 'lucide-react'
import socketService from '../services/socket'
import api from '../services/api'
import { TechStatusBadge } from '../components/Badge'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom marker icons
const createIcon = (color, size = 30) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const technicianIcon = createIcon('#3B82F6', 35)
const startIcon = createIcon('#22C55E', 25)
const endIcon = createIcon('#EF4444', 25)
const destinationIcon = createIcon('#F59E0B', 30)

// Component to fit map to bounds — only triggers when shouldFit changes to true
function FitBounds({ technicians, shouldFit, onFitDone }) {
  const map = useMap()
  
  useEffect(() => {
    if (!shouldFit) return
    if (technicians.length > 0) {
      const validTechs = technicians.filter(t => t.lastLat && t.lastLng)
      if (validTechs.length > 0) {
        const bounds = L.latLngBounds(validTechs.map(t => [t.lastLat, t.lastLng]))
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
      }
    } else {
      map.setView([23.8103, 90.4125], 12)
    }
    onFitDone()
  }, [shouldFit, technicians, map, onFitDone])
  
  return null
}

// Helper function to check if technician is actually online
const isTechOnline = (tech) => {
  if (!tech.lastPing) return false
  const lastPingTime = new Date(tech.lastPing).getTime()
  const now = Date.now()
  const timeDiff = now - lastPingTime
  // Consider online if pinged within last 2 minutes
  return tech.isTracking && timeDiff < 120000
}

export default function LiveMap() {
  const [technicians, setTechnicians] = useState([])
  const [allTechnicians, setAllTechnicians] = useState([])
  const [activeRoutes, setActiveRoutes] = useState([])
  const [selectedTech, setSelectedTech] = useState(null)
  const [focusedTech, setFocusedTech] = useState(null)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [routeHistory, setRouteHistory] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [showPanel, setShowPanel] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [shouldFitBounds, setShouldFitBounds] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const mapRef = useRef(null)

  // Initialize socket connection
  useEffect(() => {
    const socket = socketService.connect()
    
    socket.on('connect', () => {
      setIsConnected(true)
      socketService.requestAllLocations()
      socketService.requestActiveRoutes()
      socketService.requestAllTechnicians()
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    // Listen for location updates
    socketService.onAllLocations((techs) => {
      setTechnicians(techs)
      setLastUpdate(new Date())
    })

    // Listen for all technicians
    socketService.onAllTechnicians((techs) => {
      setAllTechnicians(techs)
    })

    // Listen for GPS status changes
    socketService.onTechGPSChanged((data) => {
      setAllTechnicians(prev => prev.map(t => 
        t.id === data.techId 
          ? { ...t, isTracking: data.enabled, status: data.status, lastLat: data.lat || t.lastLat, lastLng: data.lng || t.lastLng }
          : t
      ))
      if (data.enabled && data.lat && data.lng) {
        setTechnicians(prev => {
          const existing = prev.find(t => t.id === data.techId)
          if (existing) {
            return prev.map(t => 
              t.id === data.techId 
                ? { ...t, lastLat: data.lat, lastLng: data.lng, status: data.status, isTracking: true }
                : t
            )
          }
          return [...prev, {
            id: data.techId,
            name: data.techName,
            lastLat: data.lat,
            lastLng: data.lng,
            status: data.status,
            isTracking: true
          }]
        })
      }
      setLastUpdate(new Date())
    })

    socketService.onLocationUpdate((data) => {
      setTechnicians(prev => {
        const existing = prev.find(t => t.id === data.techId)
        if (existing) {
          return prev.map(t => 
            t.id === data.techId 
              ? { ...t, lastLat: data.lat, lastLng: data.lng, status: data.status }
              : t
          )
        }
        return [...prev, {
          id: data.techId,
          name: data.techName,
          lastLat: data.lat,
          lastLng: data.lng,
          status: data.status
        }]
      })
      setLastUpdate(new Date())
    })

    socketService.onActiveRoutes((routes) => {
      setActiveRoutes(routes)
    })

    socketService.onRouteStarted((data) => {
      socketService.requestActiveRoutes()
      socketService.requestAllLocations()
    })

    socketService.onRouteCompleted((data) => {
      socketService.requestActiveRoutes()
      socketService.requestAllLocations()
    })

    socketService.onJobRoute((data) => {
      if (data.locationHistory) {
        setRouteHistory(data.locationHistory)
      }
    })

    // Request initial data
    socketService.requestAllLocations()
    socketService.requestActiveRoutes()
    socketService.requestAllTechnicians()

    // Refresh data periodically
    const interval = setInterval(() => {
      socketService.requestAllLocations()
      socketService.requestActiveRoutes()
      socketService.requestAllTechnicians()
    }, 10000)

    return () => {
      clearInterval(interval)
      socketService.removeAllListeners()
    }
  }, [])

  const handleRefresh = () => {
    socketService.requestAllLocations()
    socketService.requestActiveRoutes()
    socketService.requestAllTechnicians()
    setShouldFitBounds(true)
  }

  const handleSelectTech = (tech) => {
    setSelectedTech(tech)
    setSelectedRoute(null)
    setRouteHistory([])
    setFocusedTech(tech)
    
    // Fly to technician location on click
    if (tech.lastLat && tech.lastLng && mapRef.current) {
      mapRef.current.flyTo([tech.lastLat, tech.lastLng], 16, { duration: 1.5 })
    }
    
    if (tech.jobs?.[0]?.id) {
      socketService.requestJobRoute(tech.jobs[0].id)
    }
  }

  const handleFocusTech = (tech) => {
    setSelectedTech(tech)
    setFocusedTech(tech)
    // Fly to technician location on click
    if (tech.lastLat && tech.lastLng && mapRef.current) {
      mapRef.current.flyTo([tech.lastLat, tech.lastLng], 16, { duration: 1.5 })
    }
  }

  const handleViewRoute = async (route) => {
    setSelectedRoute(route)
    setSelectedTech(null)
    
    try {
      const response = await api.getJobRoute(route.jobId)
      if (response.locationHistory) {
        setRouteHistory(response.locationHistory)
      }
    } catch (error) {
      console.error('Error fetching route:', error)
    }
  }

  const getStatusColor = (tech) => {
    // If GPS is off or not tracking, always show offline
    if (!isTechOnline(tech)) {
      return '#6B7280' // Gray for offline
    }
    // If GPS is on and tracking, use their actual status
    switch (tech.status) {
      case 'ONLINE': return '#22C55E'
      case 'ON_WAY': return '#3B82F6'
      case 'ON_SITE': return '#F59E0B'
      default: return '#22C55E' // Default to green if tracking
    }
  }

  const getDisplayStatus = (tech) => {
    if (!isTechOnline(tech)) {
      return 'OFFLINE'
    }
    return tech.status || 'ONLINE'
  }

  // Filter technicians based on search query
  const filteredTechnicians = allTechnicians.filter(tech =>
    tech.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tech.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Default center (Dhaka, Bangladesh)
  const defaultCenter = [23.8103, 90.4125]
  const center = technicians.find(t => t.lastLat && t.lastLng) 
    ? [technicians[0].lastLat, technicians[0].lastLng] 
    : defaultCenter

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Live Map</h1>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {isConnected ? 'Live' : 'Disconnected'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-sm text-dark-400">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="btn-secondary flex items-center gap-2"
          >
            {showPanel ? <X size={16} /> : <Eye size={16} />}
            {showPanel ? 'Hide Panel' : 'Show Panel'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Map */}
        <div className={`rounded-xl overflow-hidden border border-dark-700 ${showPanel ? 'flex-1 lg:flex-[2]' : 'w-full'}`}>
          <MapContainer
            center={center}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
            key={showPanel ? 'with-panel' : 'without-panel'}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <FitBounds technicians={[...technicians, ...allTechnicians]} shouldFit={shouldFitBounds} onFitDone={() => setShouldFitBounds(false)} />

            {/* Technician markers */}
            {technicians.map(tech => (
              tech.lastLat && tech.lastLng && (
                <Marker
                  key={tech.id}
                  position={[tech.lastLat, tech.lastLng]}
                  icon={createIcon(getStatusColor(tech), 35)}
                  eventHandlers={{
                    click: () => handleSelectTech(tech)
                  }}
                >
                  <Popup>
                    <div className="text-dark-900 min-w-[150px]">
                      <h3 className="font-bold text-lg">{tech.name}</h3>
                      <p className="text-sm text-gray-600">{tech.email}</p>
                      <p className="text-sm mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          isTechOnline(tech) && tech.status === 'ONLINE' ? 'bg-green-100 text-green-800' :
                          isTechOnline(tech) && tech.status === 'ON_WAY' ? 'bg-blue-100 text-blue-800' :
                          isTechOnline(tech) && tech.status === 'ON_SITE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getDisplayStatus(tech)}
                        </span>
                      </p>
                      {tech.jobs?.[0] && (
                        <p className="text-sm mt-2 text-gray-700">
                          <strong>Job:</strong> {tech.jobs[0].title}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {tech.lastLat.toFixed(6)}, {tech.lastLng.toFixed(6)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}

            {/* Offline technician markers (from allTechnicians, not already shown) */}
            {allTechnicians
              .filter(tech => tech.lastLat && tech.lastLng && !technicians.find(t => t.id === tech.id))
              .map(tech => (
                <Marker
                  key={`offline-${tech.id}`}
                  position={[tech.lastLat, tech.lastLng]}
                  icon={createIcon('#6B7280', 30)}
                  eventHandlers={{
                    click: () => handleSelectTech(tech)
                  }}
                >
                  <Popup>
                    <div className="text-dark-900 min-w-[150px]">
                      <h3 className="font-bold text-lg">{tech.name}</h3>
                      <p className="text-sm text-gray-600">{tech.email}</p>
                      <p className="text-sm mt-1">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          OFFLINE
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Last known: {tech.lastLat.toFixed(6)}, {tech.lastLng.toFixed(6)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))
            }

            {/* Active route polylines - line from start to current position */}
            {activeRoutes.map(route => {
              const tech = technicians.find(t => t.id === route.techId)
              const currentPos = tech?.lastLat && tech?.lastLng ? [tech.lastLat, tech.lastLng] : null
              const startPos = [route.startLat, route.startLng]
              
              return (
                <React.Fragment key={`route-${route.id}`}>
                  {/* Start point marker */}
                  <Marker
                    position={startPos}
                    icon={startIcon}
                  >
                    <Popup>
                      <div className="text-dark-900">
                        <h3 className="font-bold text-green-600">🚀 Start Point</h3>
                        <p className="text-sm font-medium">{route.job?.title}</p>
                        <p className="text-sm text-gray-600">{route.technician?.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Started: {new Date(route.startedAt).toLocaleString()}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Line from start to current position */}
                  {currentPos && (
                    <Polyline
                      positions={[startPos, currentPos]}
                      color="#3B82F6"
                      weight={4}
                      opacity={0.9}
                      dashArray="10, 10"
                    />
                  )}
                </React.Fragment>
              )
            })}

            {/* Selected route history polyline - full path */}
            {routeHistory.length > 1 && (
              <Polyline
                positions={routeHistory.map(p => [p.lat, p.lng])}
                color="#10B981"
                weight={5}
                opacity={0.9}
              />
            )}

            {/* Start point marker */}
            {routeHistory.length > 0 && routeHistory.find(p => p.isStartPoint) && (
              <Marker
                position={[
                  routeHistory.find(p => p.isStartPoint).lat,
                  routeHistory.find(p => p.isStartPoint).lng
                ]}
                icon={startIcon}
              >
                <Popup>
                  <div className="text-dark-900">
                    <h3 className="font-bold text-green-600">Start Point</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(routeHistory.find(p => p.isStartPoint).recordedAt).toLocaleString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* End point marker */}
            {routeHistory.length > 0 && routeHistory.find(p => p.isEndPoint) && (
              <Marker
                position={[
                  routeHistory.find(p => p.isEndPoint).lat,
                  routeHistory.find(p => p.isEndPoint).lng
                ]}
                icon={endIcon}
              >
                <Popup>
                  <div className="text-dark-900">
                    <h3 className="font-bold text-red-600">End Point</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(routeHistory.find(p => p.isEndPoint).recordedAt).toLocaleString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Side Panel */}
        {showPanel && (
          <div className="w-80 flex flex-col gap-4 overflow-y-auto">
            {/* All Technicians with GPS Status */}
            <div className="card max-h-96 overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-dark-700 flex items-center gap-2">
                <MapPin size={18} className="text-green-400" />
                <h3 className="font-semibold">All Technicians</h3>
                <span className="ml-auto bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                  {allTechnicians.filter(t => isTechOnline(t)).length} GPS On
                </span>
              </div>
              
              {/* Search Input */}
              <div className="px-3 pt-3 pb-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    type="text"
                    placeholder="Search technicians..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredTechnicians.length === 0 ? (
                  <p className="text-center text-dark-400 py-4 text-sm">
                    {searchQuery ? 'No technicians found' : 'No technicians available'}
                  </p>
                ) : (
                  filteredTechnicians.map(tech => (
                    <button
                      key={tech.id}
                      onClick={() => handleFocusTech(tech)}
                      disabled={!tech.lastLat && !tech.lastLng}
                      className={`w-full p-2 rounded-lg text-left transition-colors ${
                        focusedTech?.id === tech.id 
                          ? 'bg-green-500/20 border border-green-500' 
                          : tech.lastLat && tech.lastLng
                            ? 'bg-dark-700/50 hover:bg-dark-700 border border-transparent'
                            : 'bg-dark-800/30 border border-transparent opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isTechOnline(tech) ? 'bg-green-500' : 'bg-gray-600'
                          }`}
                        >
                          {tech.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{tech.name}</h4>
                          <div className="flex items-center gap-2 text-xs">
                            {isTechOnline(tech) ? (
                              <span className="text-green-400 flex items-center gap-1">
                                <Activity size={10} className="animate-pulse" />
                                GPS On
                              </span>
                            ) : (
                              <span className="text-gray-500">GPS Off</span>
                            )}
                            {tech.lastLat && tech.lastLng && (
                              <span className="text-dark-400">• Has Location</span>
                            )}
                          </div>
                        </div>
                        {tech.lastLat && tech.lastLng && (
                          <Navigation size={14} className="text-primary-400" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Active Technicians */}
            <div className="card flex-1 overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-dark-700 flex items-center gap-2">
                <Users size={18} className="text-primary-400" />
                <h3 className="font-semibold">Active Technicians</h3>
                <span className="ml-auto bg-primary-500/20 text-primary-400 text-xs px-2 py-0.5 rounded-full">
                  {technicians.filter(t => t.lastLat).length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {technicians.length === 0 ? (
                  <p className="text-center text-dark-400 py-8 text-sm">
                    No active technicians
                  </p>
                ) : (
                  technicians.map(tech => (
                    <button
                      key={tech.id}
                      onClick={() => handleSelectTech(tech)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedTech?.id === tech.id 
                          ? 'bg-primary-500/20 border border-primary-500' 
                          : 'bg-dark-700/50 hover:bg-dark-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: getStatusColor(tech) }}
                        >
                          {tech.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{tech.name}</h4>
                          <div className="flex items-center gap-2 text-xs">
                            <TechStatusBadge status={getDisplayStatus(tech)} />
                            {tech.isTracking && (
                              <span className="text-green-400 flex items-center gap-1">
                                <Activity size={10} className="animate-pulse" />
                                Live
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {tech.jobs?.[0] && (
                        <p className="text-xs text-dark-400 mt-2 truncate">
                          📍 {tech.jobs[0].title}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Active Routes */}
            <div className="card max-h-64 overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-dark-700 flex items-center gap-2">
                <Navigation size={18} className="text-orange-400" />
                <h3 className="font-semibold">Active Routes</h3>
                <span className="ml-auto bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full">
                  {activeRoutes.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {activeRoutes.length === 0 ? (
                  <p className="text-center text-dark-400 py-4 text-sm">
                    No active routes
                  </p>
                ) : (
                  activeRoutes.map(route => (
                    <button
                      key={route.id}
                      onClick={() => handleViewRoute(route)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedRoute?.id === route.id 
                          ? 'bg-orange-500/20 border border-orange-500' 
                          : 'bg-dark-700/50 hover:bg-dark-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-orange-400" />
                        <span className="font-medium text-sm truncate">
                          {route.job?.title || 'Unknown Job'}
                        </span>
                      </div>
                      <p className="text-xs text-dark-400 mt-1 truncate">
                        {route.technician?.name}
                      </p>
                      <p className="text-xs text-dark-500 mt-1 flex items-center gap-1">
                        <Clock size={10} />
                        Started {new Date(route.startedAt).toLocaleTimeString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="card p-4">
              <h3 className="font-semibold mb-3 text-sm">Legend</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span>Online / Start Point</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <span>On Way</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500" />
                  <span>On Site / Destination</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <span>End Point</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-500" />
                  <span>Offline</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
