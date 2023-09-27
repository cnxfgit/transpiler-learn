const {EvaMPP} = require("../src/transplier/EvaMPP")

const eva = new EvaMPP()

const {ast, target} = eva.compile([
    "begin", 42, '"hello"'
])
console.log("\n-----------------------------------")
console.log(" 1. Compiled AST:\n")

console.log(JSON.stringify(ast, null, 2))

console.log("\n-----------------------------------")
console.log(" 2. Compiled code:\n")

console.log(target)