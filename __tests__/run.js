const {EvaMPP} = require("../src/transplier/EvaMPP")

const eva = new EvaMPP()

const {ast, target} = eva.compile(`
    (var user-name "43")
    (print "user-name =" user-name)
    (set user-name 100)
    (print "user-name =" user-name)
    (print (Number "1"))
`)
console.log("\n-----------------------------------")
console.log(" 1. Compiled AST:\n")

console.log(JSON.stringify(ast, null, 2))

console.log("\n-----------------------------------")
console.log(" 2. Compiled code:\n")

console.log(target)


console.log("\n-----------------------------------")
console.log(" 3. Result:\n")