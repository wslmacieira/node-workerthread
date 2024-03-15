const { runPipeline } = require("./pipeline.js");
const data = Array.from({ length: 200 }, (_, i) => i + 1)
runPipeline(data, 25)