const { parentPort, workerData } = require("worker_threads")
let response = []
let promises = []
workerData.data.forEach(element => {
    promises.push(fetch('https://jsonplaceholder.typicode.com/todos/' + element)
        .then(response => response.json())
        .then(json => {
            response.push(json)
        }))
});
(async () => {
    await Promise.all(promises)
    await new Promise(resolve => setTimeout(resolve, 100))
    parentPort.postMessage(response)
})()
