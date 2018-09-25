const GPS = require(`gps`)
const geohash = require(`ngeohash`)
const Device = require(`./device`)
const SerialPort = require(`serialport`)

class SendGpsData {
    constructor(delay) {
        this.neo6m = new Device(`gps`, `/dev/ttyS0`, `\r\n`)
        this.mkrFox = null
        this.gps = new GPS
        this.precision = 12
        this.gps.state.bearing = 0
        this.prev = {
            lat: null,
            lon: null,
            encoded : null,
        }
        this.delay = delay

        this.init()
    }

    onGps(data) {
        if (this.prev.lat !== null && this.prev.lon !== null) {
            this.gps.state.bearing = GPS.Heading(
                this.prev.lat,
                this.prev.lon,
                this.gps.state.lat,
                this.gps.state.lon
            )
        }
        this.prev.lat = this.gps.state.lat
        this.prev.lon = this.gps.state.lon
        this.prev.encoded = geohash.encode(this.prev.lat, this.prev.lon, this.precision)
    }

    async getConnectedArduino() {
        let file = null
        let connected = false
        const ports = await SerialPort.list()
        const portsLength = ports.length
        ports.forEach(port => {
            const manufacturer = port[`manufacturer`]
            if (
                typeof manufacturer !== `undefined` &&
                manufacturer.toLowerCase().includes(`arduino`)
            ) {
                file = port[`comName`]
                connected = true
            }
        })
        if (!connected) {
            await this.getConnectedArduino()
        }

        return { file, connected }

    }

    sendData() {
        console.log(`Sending: ${this.prev.encoded}\n`)
        this.mkrFox.port.write(`${this.prev.encoded}\n`)
    }

    async init() {
        const arduino = await this.getConnectedArduino()

        if (arduino.connected) {
            this.mkrFox = new Device(`fox`, arduino.file, `\n`)
        }

        this.neo6m.parser.on(`data`, data => this.gps.update(data))

        this.gps.on(`data`, data => this.onGps(data))

        setInterval(() => {
            this.sendData()
        }, this.delay)
        this.mkrFox.parser.on(`data`, data => console.log(`mkrFox says: ${data}`))
    }
}

new SendGpsData(2000)