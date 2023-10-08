class JSCodegen {
    constructor({indent = 2}) {
        this._indent = indent
        this._currentIndent = 0
    }

    generate(exp) {
        return this.Program(exp)
    }

    Program(exp) {
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

    Identifier(exp) {
        return exp.name;
    }

    VariableDeclaration(exp) {
        let {id, init} = exp.declarations[0];
        return `let ${this.gen(id)} = ${this.gen(init)};`;
    }

    AssignmentExpression(exp) {
        return `${this.gen(exp.left)} ${exp.operator} ${this.gen(exp.right)}`;
    }

    CallExpression(exp) {
        const callee = this.gen(exp.callee)
        const args = exp.arguments.map(arg => this.gen(arg)).join(', ');
        return `${callee}(${args})`;
    }

    BinaryExpression(exp) {
        let operator = exp.operator;
        if (operator === "==") {
            operator = "===";
        }

        if (operator === "!=") {
            operator = "!==";
        }

        return `(${this.gen(exp.left)} ${operator} ${this.gen(exp.right)})`;
    }

    IfStatement(exp){
        const test = this.gen(exp.test);
        const consequent = this.gen(exp.consequent);
        const alternate = exp.alternate != null ?
            ` else ${this.gen(exp.alternate)}` : '';
        return `if ${test} ${consequent} ${alternate}`;
    }

    WhileStatement(exp){
        return `while (${this.gen(exp.test)}) ${this.gen(exp.body)}`;
    }

    ReturnStatement(exp){
        return `return ${this.gen(exp.argument)};`;
    }

    ThrowStatement(exp){
        return `throw ${this.gen(exp.argument)};`
    }

    TryStatement(exp){
        return `try ${this.gen(exp.block)} ${this.gen(exp.handler)};`
    }

    CatchClause(exp){
        return `catch ${this.gen(exp.param)} ${this.gen(exp.body)};`
    }

    ObjectExpression(exp){
        const properties = exp.properties.map(prop => this.gen(prop));
        return `{${properties.join(', ')}}`
    }

    ObjectProperty(exp){
        return `${this.gen(exp.key)}: ${this.gen(exp.value)}`
    }

    ArrayExpression(exp){
        const elements = exp.elements.map(element => this.gen(element));
        return `[${elements.join(", ")}]`;
    }

    MemberExpression(exp){
        if (exp.computed) {
            return `${this.gen(exp.object)}[${this.gen(exp.property)}]`
        }
        return `${this.gen(exp.object)}.${this.gen(exp.property)}`
    }

    FunctionDeclaration(exp){
        const id = this.gen(exp.id);
        const params = exp.params.map(param => this.gen(param)).join(', ');
        const body = this.gen(exp.body);
        const async = exp.async ? 'async ' : '';
        const generator = exp.generator ? '*' : '';
        return `\n${async}function${generator} ${id}(${params}) ${body}\n`
    }

    YieldExpression(exp){
        return `yield`
    }

    LogicalExpression(exp) {
        return `(${this.gen(exp.left)} ${exp.operator} ${this.gen(exp.right)})`;
    }

    UnaryExpression(exp){
        return `${exp.operator}${this.gen(exp.argument)}`;
    }

    BlockStatement(exp) {
        this._currentIndent += this._indent

        let result = '{\n' + exp.body.map(expr => this._ind() + this.gen(expr)).join('\n') + '\n'

        this._currentIndent -= this._indent

        result += this._ind() + '}'
        return result
    }

    ExpressionStatement(exp) {
        return `${this.gen(exp.expression)};`;
    }

    _ind() {
        return ' '.repeat(this._currentIndent)
    }
}

module.exports = {
    JSCodegen,
}