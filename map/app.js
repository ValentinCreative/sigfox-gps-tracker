import moment from 'moment'
import geohash from 'ngeohash'
import L from 'leaflet'
const layerMap = `http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`

const hex2a = hex => {
    hex = hex.toString()
    let str = ``
    for (let i = 0; (i < hex.length && hex.substr(i, 2) !== `00`); i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
    return str
}

const getBasicAuth = (login, password) => {
    const encoded = btoa(`${login}:${password}`)
    return `Basic ${encoded}`
}

const getDeviceMessages = async (deviceId, since) => {
    const login = `5ba8cbd3e833d90c10e6edf6`
    const password = `ccb00a7e3a57d308af2b92fb42a15756`
    const Authorization = getBasicAuth(login, password)
    const headers = new Headers({
        Authorization,
        Accept: `application/json`,
        'Access-Control-Allow-Origin' : `*`,
        'Access-Control-Allow-Methods' : `GET, PUT, POST, DELETE, OPTIONS`,
        'Content-Type': `application/json`,
    })

    // const mode = `no-cors`
    const url = `https://backend.sigfox.com/api/devices/${deviceId}/messages?since=${since}`
    const request = new Request(url, { headers})
    const response = await fetch(request, {method: 'GET',
  mode: 'cors',})
    const { data } = await response.json()
    return data
}

const getLocations = async fromDate => {
    const deviceId = `18E05D`
    const messages = await getDeviceMessages(deviceId, fromDate)
    console.log(messages)
    const locations = []
    messages.forEach(message => {
        const location = {
            timestamp : message.time,
            date : moment(message.time, `X`).format(`YYYY-MM-DD HH:mm`),
            geohash : hex2a(message.data),
        }
        locations.push({
            ...location,
            ...geohash.decode(location.geohash)
        })
    })
    return locations
}

const addMarkers = (map, locations) => {
    locations.forEach(location => {
        L.marker([location.latitude, location.longitude]).addTo(map)
    })
}

const getRoute = (map, locations, fit = false) => {
    const points = locations.map(location => [location.latitude, location.longitude])
    const polyline = L.polyline(points, {color: `red`})
    polyline.addTo(map)
    if (fit) {
        map.fitBounds(polyline.getBounds())
    }
}

const renderTable = (locations) => {
    const wrapper = document.querySelector(`.data`)
    let html = ``
    locations.forEach(location => {
        html += `<tr>
            <td>${location.date}</td>
            <td>${location.latitude}</td>
            <td>${location.longitude}</td>
        </tr>`
    })
    wrapper.innerHTML = html
}

const refreshMap = async (map, Marker) => {
    const locations = await getLocations(1537520212)
    const location = locations[locations.length - 1]
    Marker.setLatLng({
        lat: location.latitude,
        lng: location.longitude,
    })
    getRoute(map, locations)
    renderTable(locations)
}

const initMap = async () => {
    const locations = await getLocations(1537520212)
    const lastSeen = locations[locations.length - 1]

    const map = L.map(`map`).setView([lastSeen.latitude, lastSeen.longitude], 10)
    const layer = L.tileLayer(layerMap, {
        maxZoom: 18,
        id: `mapbox.streets`,
    })
    const Marker = L.marker([lastSeen.latitude, lastSeen.longitude])
    Marker.addTo(map)
    layer.addTo(map)
    getRoute(map, locations, true)

    setInterval(() => {
        refreshMap(map, Marker)
    }, 10000)

    renderTable(locations)
}

document.addEventListener(`DOMContentLoaded`, () => {
    initMap()
})