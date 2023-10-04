class JSTransform {
    AsyncFunctionToGenerator(fnNode){
        const genFn = {
            type: "FunctionDeclaration",
            id: {
                type: "Identifier",
                name: `_${fnNode.id.name}`
            },
            generator: true,
            async: true,
            params: fnNode.params
        }

        const fnBlock = fnNode.body;
        const genBlockBody = [...fnBlock.body]
        for (let i = 1; i < genBlockBody.length; i+=2) {
            genBlockBody.splice(i, 0, {
                type: 'ExpressionStatement',
                expression: {type: 'YieldExpression'},
            })
        }

        genFn.body = {type: 'BlockStatement', body: genBlockBody}

        return genFn
    }
}

module.exports = {
    JSTransform
}