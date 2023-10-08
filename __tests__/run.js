const {EvaMPP} = require("../src/transplier/EvaMPP")

const eva = new EvaMPP()

const {ast, target} = eva.compile(`
    (var point (rec (x 1) (y 2)))
    (match point 
        (rec (x 1) (y 2)) (print "full match")
        (rec (x 1) y) (print "x match, y is " y)
        1 (print "point is 1")
        _ (print "no match")   )    
`)
console.log("\n-----------------------------------")
console.log(" 1. Compiled AST:\n")

console.log(JSON.stringify(ast, null, 2))

console.log("\n-----------------------------------")
console.log(" 2. Compiled code:\n")

console.log(target)


console.log("\n-----------------------------------")
console.log(" 3. Result:\n")