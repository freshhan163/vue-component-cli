/**
 * @file test-js-ast.js
 * @desc 读取test-source.js文件的源码，学习 babel库的API
 */
const path = require('path');
const fs = require('fs');

const testJsFile = fs.readFileSync(path.resolve(__dirname, './test-source.js'), 'utf-8');

const babelParseValue = require("@babel/parser").parse(testJsFile);

console.log('babelParseValue =', babelParseValue);

// 读取文档信息，使用 @babel/traverse，遍历ast的节点
const traverse = require('@babel/traverse').default;

traverse(babelParseValue, {
    enter(path) {
        // 替换变量名称
        if (path.isIdentifier({ name: "a" })) {
            path.node.name = "x";
        }
    },
    // 替换函数名称
    FunctionDeclaration: function(path) {
        path.node.id.name = "fx";
    },
});

// 输出信息
const generate = require('@babel/generator').default;
const output = generate(babelParseValue, {}, testJsFile); // 返回对象包含 code | map | rawMappings | decodeMap
console.log('AST遍历后，输出的代码 output = \n', output.code);
