const {EvaMPP} = require("../src/transplier/EvaMPP")

const eva = new EvaMPP()

const {ast, target} = eva.compile(`
    (def handle (id) 
        (begin 
            (print id 1)
            (print id 2)))
    (handle "x")
    (handle "y")
    
    (spawn handle "x")
    (spawn handle "y")
`)
console.log("\n-----------------------------------")
console.log(" 1. Compiled AST:\n")

console.log(JSON.stringify(ast, null, 2))

console.log("\n-----------------------------------")
console.log(" 2. Compiled code:\n")

console.log(target)


console.log("\n-----------------------------------")
console.log(" 3. Result:\n")