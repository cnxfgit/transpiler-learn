const {JSCodegen} = require("../codegen/JSCodegen.js")

const jsCodegen = new JSCodegen()

class EvaMPP {
    compile(program) {
        // const evaAST = evaParser.parse(program)

        const evaAST = program
        const jsAST = this.gen(evaAST)
        const target = jsCodegen.generate(jsAST)

        this.saveToFile('./out.js', target)
        return {ast: jsAST, target}
    }

    saveToFile(filename, code) {

    }

    gen(exp) {
        if (this._isNumber(exp)) {
            return {
                type: 'NumericLiteral',
                value: exp
            }
        }

        throw `Unexpected expression ${JSON.stringify(exp)}.`
    }

    _isNumber(exp){
        return typeof exp == "number"
    }
}

module.exports = {
    EvaMPP
}