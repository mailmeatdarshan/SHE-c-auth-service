const { createDefaultEsmPreset } = require("ts-jest")
const { verbose } = require("winston")

module.exports = {
    ...createDefaultEsmPreset(),
    testEnvironment: "node",
    verbose: true,
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
}
