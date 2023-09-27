const {JSCodegen} = require("../codegen/JSCodegen.js")

const jsCodegen = new JSCodegen({indent: 2})

class EvaMPP {
    compile(program) {
        // const evaAST = evaParser.parse(program)

        const evaAST = ['begin', program]
        const jsAST = this.genProgram(evaAST)
        const target = jsCodegen.generate(jsAST)

        this.saveToFile('./out.js', target)
        return {ast: jsAST, target}
    }

    saveToFile(filename, code) {

    }

    genProgram(programBlock){
        const [_tag, ...expressions] = programBlock;

        const body = []

        expressions.forEach(expr => body.push(this._toStatement(this.gen(expr))));

        return {
            type: "Program",
            body
        }
    }

    gen(exp) {
        if (this._isNumber(exp)) {
            return {
                type: 'NumericLiteral',
                value: exp
            }
        }

        if (this._isString(exp)) {
            return {
                type: 'StringLiteral',
                value: exp.slice(1, -1)
            }
        }

        if (exp[0] === "begin") {
            const [_tag, ... expressions] = exp;
            const body = [];
            expressions.forEach(expr => {
                body.push(this._toStatement(this.gen(expr)))
            })
            return {
                type: "BlockStatement",
                body
            }
        }

        throw `Unexpected expression ${JSON.stringify(exp)}.`
    }

    _isNumber(exp){
        return typeof exp == "number"
    }

    _isString(exp){
        return typeof exp === "string" && exp[0] === '"' && exp.slice(-1) === '"'
    }

    _toStatement(expression){
        switch (expression.type) {
            case "NumericLiteral":
            case "StringLiteral":
                return {
                    type: "ExpressionStatement",
                    expression
                }
            default:
                return expression;
        }
    }
}

module.exports = {
    EvaMPP
}