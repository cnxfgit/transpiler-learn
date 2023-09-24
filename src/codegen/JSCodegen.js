class JSCodegen {
    generate(exp){
        return this.gen(exp)
    }

    gen(exp){
        if (this[exp.type] == null) {
            throw `Unexpected expression: ${exp.type}.`
        }
        return this[exp.type](exp)
    }

    NumericLiteral(exp){
        return `${exp.value}`
    }
}

module.exports = {
    JSCodegen,
}