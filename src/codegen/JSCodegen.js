class JSCodegen {
    constructor({indent = 2}) {
        this._indent = indent
        this._currentIndent = 0
    }

    generate(exp) {
        return this.Program(exp)
    }

    Program(exp){
        return exp.body.map(expr => this.gen(expr)).join('\n');
    }

    gen(exp) {
        if (this[exp.type] == null) {
            throw `Unexpected expression: ${exp.type}.`
        }
        return this[exp.type](exp)
    }

    NumericLiteral(exp) {
        return `${exp.value}`
    }

    StringLiteral(exp) {
        return `"${exp.value}"`
    }

    BlockStatement(exp) {
        this._currentIndent += this._indent

        let result = '{\n' + exp.body.map(expr => this._ind() + this.gen(expr)).join('\n') + '\n'

        this._currentIndent -= this._indent

        result+= this._ind() + '}'
        return result
    }

    ExpressionStatement(exp) {
        return `${this.gen(exp.expression)};`;
    }

    _ind(){
        return ' '.repeat(this._currentIndent)
    }
}

module.exports = {
    JSCodegen,
}