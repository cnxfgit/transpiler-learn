const evaParser = require("../parser/evaParser.js")

const {JSCodegen} = require("../codegen/JSCodegen.js")
const {JSTransform} = require("../transform/JSTransform")

const fs = require("fs")

const jsCodegen = new JSCodegen({indent: 2});
const jsTransform = new JSTransform();

class EvaMPP {
    compile(program) {
        this._functions = {}

        const evaAST = evaParser.parse(`(begin ${program})`)

        const jsAST = this.genProgram(evaAST)
        const target = jsCodegen.generate(jsAST)

        this.saveToFile('./out.js', target)
        return {ast: jsAST, target}
    }

    saveToFile(filename, code) {
        const out = `
const {print,spawn,scheduler,sleep,NextMatch} = require("./src/runtime");
${code}
        `
        fs.writeFileSync(filename, out, 'utf-8')
    }

    genProgram(programBlock) {
        const [_tag, ...expressions] = programBlock;

        const prevBlock = this._currentBlock;
        const body = (this._currentBlock = []);

        expressions.forEach(expr => body.push(this._toStatement(this.gen(expr))));

        this._currentBlock = prevBlock;

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

        if (this._isUnary(exp)) {
            let operator = exp[0];
            if (operator === "not") {
                operator = "!"
            }

            return {
                type: "UnaryExpression",
                operator,
                argument: this.gen(exp[1])
            }
        }

        if (this._isBinary(exp)) {
            return {
                type: 'BinaryExpression',
                left: this.gen(exp[1]),
                operator: exp[0],
                right: this.gen(exp[2])
            }
        }

        if (this._isLogicalBinary(exp)) {
            let operator;

            switch (exp[0]) {
                case 'or':
                    operator = '||'
                    break
                case 'and':
                    operator = '&&'
                    break
                default:
                    throw  `Unknown logical operator ${exp[0]}.`;
            }

            return {
                type: 'LogicalExpression',
                left: this.gen(exp[1]),
                operator,
                right: this.gen(exp[2])
            }
        }

        if (exp[0] === "begin") {
            const [_tag, ...expressions] = exp;
            const prevBlock = this._currentBlock;
            const body = (this._currentBlock = []);

            expressions.forEach(expr => {
                body.push(this._toStatement(this.gen(expr)))
            })

            this._currentBlock = prevBlock;

            return {
                type: "BlockStatement",
                body
            }
        }

        if (exp[0] === "if") {
            return {
                type: 'IfStatement',
                test: this.gen(exp[1]),
                consequent: this._toStatement(this.gen(exp[2])),
                alternate: this._toStatement(this.gen(exp[3])),
            }
        }

        if (exp[0] === "while") {
            return {
                type: 'WhileStatement',
                test: this.gen(exp[1]),
                body: this._toStatement(this.gen(exp[2])),
            }
        }

        if (exp[0] === "def") {
            const id = this.gen(this._toVariableName(exp[1]));
            const params = exp[2].map(param => this.gen(param));
            let bodyExp = exp[3];

            if (!this._hasBlock(bodyExp)) {
                bodyExp = ['begin', bodyExp]
            }

            const last = bodyExp[bodyExp.length - 1];
            if (!this._isStatement(last) && last[0] !== "return") {
                bodyExp[bodyExp.length - 1] = ["return", last]
            }

            const body = this.gen(bodyExp)

            const fn = {
                type: 'FunctionDeclaration',
                id,
                params,
                body
            };

            this._functions[id.name] = {
                fn,
                definingBlock: this._currentBlock,
                index: this._currentBlock.length
            }

            return fn;
        }

        if (exp[0] === 'return') {
            return {
                type: 'ReturnStatement',
                argument: this.gen(exp[1])
            }
        }

        if (exp[0] === 'list') {
            const elements = exp.slice(1).map(element => this.gen(element));
            return {
                type: "ArrayExpression",
                elements,
            }
        }

        if (exp[0] === 'idx') {
            return {
                type: "MemberExpression",
                computed: true,
                object: this.gen(exp[1]),
                property: this.gen(exp[2])
            }
        }

        if (exp[0] === 'rec') {
            const properties = exp.slice(1).map(entry => {
                let key;
                let value;

                if (Array.isArray(entry)) {
                    key = this.gen(entry[0])
                    value = this.gen(entry[1])
                } else {
                    key = this.gen(entry)
                    value = key
                }

                return {
                    type: "ObjectProperty",
                    key,
                    value,
                }
            });
            return {
                type: "ObjectExpression",
                properties,
            }
        }

        if (exp[0] === "prop") {
            return {
                type: "MemberExpression",
                object: this.gen(exp[1]),
                property: this.gen(exp[2])
            }
        }

        if (exp[0] === "match") {
            const value = this.gen(exp[1]);
            let topLevelTry;
            let insertBlock;
            let i = 2;

            do {
                const [pattern, ifNode] = jsTransform.expressionToMatchPattern(
                    this.gen(exp[i]),
                    value
                );

                const handler = this._toStatement(this.gen(exp[i + 1]))

                const tryBody = [handler]
                if (pattern == null && ifNode == null) {
                    insertBlock.body.push(handler);
                    return topLevelTry;
                }

                if (ifNode != null) {
                    tryBody.unshift(ifNode);
                }

                if (pattern != null) {
                    const destructVar = {
                        type: "VariableDeclaration",
                        declarations: [{
                            type: "VariableDeclarator",
                            id: pattern,
                            init: value
                        }]
                    }

                    tryBody.unshift(destructVar)
                }

                const catchParam = {
                    type: "Identifier",
                    name: "e",
                }

                const nextMatchIf = {
                    type: "IfStatement",
                    test: {
                        type: "BinaryExpression",
                        left: catchParam,
                        operator: "!==",
                        right: {
                            type: "Identifier",
                            name: "NextMatch",
                        }
                    },
                    consequent:{
                        type: "ThrowStatement",
                        argument: catchParam,
                    }
                }

                const tryNode = {
                    type: "TryStatement",
                    block: {
                        type: "BlockStatement",
                        body: tryBody,
                    },
                    handler: {
                        type: "CatchClause",
                        param: catchParam,
                        body: {
                            type: "BlockStatement",
                            body: [nextMatchIf]
                        }
                    }
                }

                if (insertBlock != null) {
                    insertBlock.body.push(tryNode);
                }

                if (topLevelTry == null) {
                    topLevelTry = tryNode
                }

                insertBlock = topLevelTry.handler.body

                i += 2;
            } while (i < exp.length);

            return topLevelTry;
        }

        if (Array.isArray(exp)) {
            const fnName = this._toVariableName(exp[0])
            const callee = this.gen(fnName)
            const args = exp.slice(1).map(arg => this.gen(arg))

            if (callee.name === "spawn") {
                const fnName = args[0].name;
                const processName = `_${fnName}`;
                if (this._functions[processName] == null) {
                    const processFn = jsTransform.AsyncFunctionToGenerator(
                        this._functions[fnName].fn
                    )

                    this._functions[processName] = {
                        ...this._functions[fnName],
                        fn: processFn,
                        index: this._functions[fnName].index + 1
                    }

                    this._functions[fnName].definingBlock.splice(
                        this._functions[processName].index,
                        0,
                        processFn
                    )
                }
                args[0].name = processName;
            }

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

    _hasBlock(exp) {
        return exp[0] === 'begin';
    }

    _isStatement(exp) {
        return (
            exp[0] === "begin" ||
            exp[0] === "if" ||
            exp[0] === "while" ||
            exp[0] === "var"
        )
    }

    _toJSName(name) {
        return name.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
    }

    _isBinary(exp) {
        if (exp.length !== 3) {
            return false;
        }
        return (
            exp[0] === "+" ||
            exp[0] === "-" ||
            exp[0] === "*" ||
            exp[0] === "/" ||
            exp[0] === "==" ||
            exp[0] === "!=" ||
            exp[0] === ">" ||
            exp[0] === "<" ||
            exp[0] === "<=" ||
            exp[0] === ">="
        );
    }

    _isLogicalBinary(exp) {
        if (exp.length !== 3) {
            return false;
        }
        return exp[0] === 'or' || exp[0] === 'and';
    }

    _isUnary(exp) {
        if (exp.length !== 2) {
            return false;
        }
        return exp[0] === "not" || exp[0] === "-"
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
            case "BinaryExpression":
            case "LogicalExpression":
            case "UnaryExpression":
            case "YieldExpression":
            case "ArrayExpression":
            case "MemberExpression":
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