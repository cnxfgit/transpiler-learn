class JSTransform {
    AsyncFunctionToGenerator(fnNode) {
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
        for (let i = 1; i < genBlockBody.length; i += 2) {
            genBlockBody.splice(i, 0, {
                type: 'ExpressionStatement',
                expression: {type: 'YieldExpression'},
            })
        }

        genFn.body = {type: 'BlockStatement', body: genBlockBody}

        return genFn
    }

    expressionToMatchPattern(exp, mainValue, checks = []) {
        if (exp.type === "ObjectExpression") {
            exp.properties.forEach(proterty => {
                if (proterty.value.type === "Identifier") {
                    return;
                }

                if (proterty.value.type === "NumericLiteral" ||
                    proterty.value.type === "StringLiteral") {
                    checks.push(this._createPropCompare(proterty));
                } else if (proterty.value.type === "ObjectExpression") {
                    this.expressionToMatchPattern(proterty.value, mainValue, checks);
                }
            });

            const ifNode = this._createIfTest(checks)
            return [exp, ifNode];
        } else if (exp.type === "NumericLiteral" || exp.type === "StringLiteral") {
            checks.push(this._createValueCompare(exp, mainValue))
            const ifNode = this._createIfTest(checks)
            return [null, ifNode];
        } else if (exp.type === "identifier") {
            return [null, null]
        }
    }

    _createPropCompare(property) {
        const expected = property.value;

        const binding = {
            type: "Identifier",
            name: `_${property.key.name}`,
        }

        property.value = binding

        return this._createValueCompare(binding, expected);
    }

    _createValueCompare(exp, expected) {
        return {
            type: "BinaryExpression",
            left: exp,
            operator: "!==",
            right: expected,
        }
    }

    _createIfTest(checks) {
        let ifCond = checks[0];
        let i = 1;

        while (i < checks.length) {
            ifCond = {
                type: "LogicExpression",
                left: ifCond,
                operator: "||",
                right: checks[i]
            }
            i++
        }

        return {
            type: "IfStatement",
            test: ifCond,
            consequent: {
                type: "ThrowStatement",
                argument: {
                    type: "Identifier",
                    name: "NextMatch"
                }
            }
        }
    }
}

module.exports = {
    JSTransform
}