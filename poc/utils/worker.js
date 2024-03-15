const { parentPort, workerData } = require("worker_threads")
// let counter = 0
let result = []
let promises = []
// for (let i = 0; i < workerData.data; i++) {
//     // console.log(i);
//     counter++
// }
workerData.data.forEach(element => {
    promises.push(fetch('https://jsonplaceholder.typicode.com/todos/' + element)
        .then(response => response.json())
        .then(json => {
            result.push(json)
        }))
});
(async () => {
    await Promise.all(promises)
    await new Promise(resolve => setTimeout(resolve, 1000))
    parentPort.postMessage(result)
})()
// parentPort.postMessage(workerData.data)
