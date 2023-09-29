const evaParser = require("../parser/evaParser.js")

const {JSCodegen} = require("../codegen/JSCodegen.js")

const fs = require("fs")

const jsCodegen = new JSCodegen({indent: 2})

class EvaMPP {
    compile(program) {
        const evaAST = evaParser.parse(`(begin ${program})`)

        const jsAST = this.genProgram(evaAST)
        const target = jsCodegen.generate(jsAST)

        this.saveToFile('./out.js', target)
        return {ast: jsAST, target}
    }

    saveToFile(filename, code) {
        const out = `
const {print} = require("./src/runtime");
${code}
        `
        fs.writeFileSync(filename, out, 'utf-8')
    }

    genProgram(programBlock) {
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

        if (this._isVariableName(exp)) {
            return {
                type: 'Identifier',
                name: this._toVariableName(exp)
            }
        }

        if (exp[0] === 'var') {
            return {
                type: 'VariableDeclaration',
                declarations: [
                    {
                        type: 'VariableDeclarator',
                        id: this.gen(this._toVariableName(exp[1])),
                        init: this.gen(exp[2])
                    }
                ]
            }
        }

        if (exp[0] === "set") {
            return {
                type: 'AssignmentExpression',
                operator: '=',
                left: this.gen(this._toVariableName(exp[1])),
                right: this.gen(exp[2]),
            }
        }

        if (exp[0] === "begin") {
            const [_tag, ...expressions] = exp;
            const body = [];
            expressions.forEach(expr => {
                body.push(this._toStatement(this.gen(expr)))
            })
            return {
                type: "BlockStatement",
                body
            }
        }

        if (Array.isArray(exp)) {
            const fnName = this._toVariableName(exp[0])
            const callee = this.gen(fnName)
            const args = exp.slice(1).map(arg => this.gen(arg))
            return {
                type: 'CallExpression',
                callee,
                arguments: args
            }
        }

        throw `Unexpected expression ${JSON.stringify(exp)}.`
    }

    _isVariableName(exp) {
        return typeof exp === "string" && /^[+\-*/<>=a-zA-Z0-9_\.]+$/.test(exp);
    }

    _toVariableName(exp) {
        return this._toJSName(exp);
    }

    _toJSName(name) {
        return name.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
    }

    _isNumber(exp) {
        return typeof exp == "number"
    }

    _isString(exp) {
        return typeof exp === "string" && exp[0] === '"' && exp.slice(-1) === '"'
    }

    _toStatement(expression) {
        switch (expression.type) {
            case "NumericLiteral":
            case "StringLiteral":
            case "AssignmentExpression":
            case "Identifier":
            case "CallExpression":
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