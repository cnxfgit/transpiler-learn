const {EvaMPP} = require("../src/transplier/EvaMPP")

const eva = new EvaMPP()

const {ast, target} = eva.compile(`
    (var data (list 1 2 3))
    (idx data 0)
    (print data (idx data 0))
    (var z 3)
    (var point (rec (x 1) (y 2) z))
    (prop point x)
    (print point (prop point x))
`)
console.log("\n-----------------------------------")
console.log(" 1. Compiled AST:\n")

console.log(JSON.stringify(ast, null, 2))

console.log("\n-----------------------------------")
console.log(" 2. Compiled code:\n")

console.log(target)


console.log("\n-----------------------------------")
console.log(" 3. Result:\n")