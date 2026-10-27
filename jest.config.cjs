const { createDefaultEsmPreset } = require("ts-jest")

module.exports = {
    ...createDefaultEsmPreset(),
    testEnvironment: "node",
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
}
