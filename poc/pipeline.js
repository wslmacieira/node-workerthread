const { Readable } = require('node:stream')
const { pipeline } = require('node:stream/promises')
const { createBufferObjectStream } = require('./utils/buffer-object-streams')
const { runWorkerPromise } = require('./utils/worker-promise')

let response
let runningProcs = []
const maxParallelProcs = 10

async function runProcessInQueue(fnPromise) {
  let result
  if (runningProcs.length >= maxParallelProcs) {
      console.log("Queue full, waiting some process to finish");
      await runningProcs[0];
      return runProcessInQueue(fnPromise)
  }
  console.log('Running proc ...');
  const promise = fnPromise()
  runningProcs.push(promise)

  function removePromise() {
      console.log('removing promise...');
      runningProcs = runningProcs.filter(p => p !== promise)
  }

  try {
      result = await promise
  } catch (error) {
      throw error
  } finally {
      removePromise()
  }
  // console.log('Proc done', result);
  return result
}

async function* createReadableStream(data) {
    // yield Buffer.from(`tick: ${new Date().toISOString()}`)
    for (const element of data) {
        yield element
    }
}

async function* executePromiseStream(stream) {
  const promises = []
  for await (const chunk of stream) {
    promises.push(runProcessInQueue(() =>runWorkerPromise(chunk)))
    console.log('Writable >>>', chunk.toString())
  }
  const result = (await Promise.all(promises)).flat().sort((a, b) => a.id - b.id)
  response = result
  // console.log('Result >>>', result);
}

const runPipeline = async (data, size) => {
const start = Date.now();
await pipeline(
    Readable.from(createReadableStream(data)),
    createBufferObjectStream(size),
    executePromiseStream,
  )
  console.log('Response >>>', response);
  console.log(`Pipeline done in: ${Date.now() - start}ms`);
}

module.exports = { runPipeline }