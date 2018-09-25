const SerialPort = require(`serialport`)
const ReadLine = require(`@serialport/parser-readline`)

module.exports = class Device {
    constructor(name, file, delimiter, baudRate = 9600) {
        this.name = name
        this.file = file
        this.delimiter = delimiter
        this.baudRate = baudRate
        this.error = false

        this.port = this.setPort()
        this.parser = this.setParser()

        return {
            port : this.port,
            parser : this.parser,
            error : this.error,
        }
    }

    setPort() {
        const port = new SerialPort(this.file, { baudRate : this.baudRate })
        port.on(`error`, e => {this.error = true})
        return port
    }

    setParser() {
        return this.port.pipe(new ReadLine({ delimiter: this.delimiter }))
    }
}