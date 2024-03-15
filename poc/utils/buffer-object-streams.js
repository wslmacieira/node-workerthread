const { Transform } = require("node:stream")

exports.createBufferObjectStream = function(size) {
    let buffer = []
    return new Transform({
        objectMode: true,
        transform(chunk, _encoding, callback) {
            buffer.push(chunk)
            if(buffer.length >= size) {
               this.push(buffer)
                buffer = []
            }
            callback()
        },
        flush(callback) {
            if(buffer.length) {
                this.push(buffer)
            }
            callback()
        }
    })
}