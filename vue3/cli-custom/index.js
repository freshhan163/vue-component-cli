/**
 * @file index.js
 * @desc 使用vue/compiler-sfc库，解析文件
 */
const { parse, compileScript, compileTemplate, babelParse } = require('vue/compiler-sfc');
const path = require('path');
const fs = require('fs');

const source = fs.readFileSync(path.resolve('src/button/index.vue'), 'utf-8');
const parseValue = parse(
    source,
    {
        filename: 'button.vue'
    }
);
// 获取template.content; scriptSetup.content
// console.log(parseValue);

const templateValue = compileTemplate({
    id: 'test',
    filename: 'button.vue',
    source: parseValue.descriptor.template.content,
    slotted: true
});
// console.log(templateValue); // code | ast

// 将script setup语法，转换为jsx语法
const scriptValue = compileScript(parseValue.descriptor, {
    id: 'test',
    filename: 'button.vue'
});

// 生成的content，其实和.tsx文件很相似
console.log('scriptValue = \n', scriptValue.content); // content | scriptSetupAst（VariableDeclaration \ FunctionDeclaration）

// 将script setup语法，转换为 AST树
function babelParseAst(content) {
    return babelParse(content, {
        allowImportExportEverywhere: true,
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
    });
}
console.log('jsx语法转为AST树 =', babelParseAst(scriptValue.content));
console.log('script setup 语法转为AST树 =', babelParseAst(parseValue.descriptor.scriptSetup.content));

// 如何将template 、 script部分生成ast：compiler/sfc已经生成了
// const traverse = require('@babel/traverse').default;
// const generate = require('@babel/generator').default;

// // 解析js代码为 ast树
// const jsAst = require("@babel/parser").parse(scriptValue.content, {
//     sourceType: 'module'
// });
// console.log('jsAst = ', jsAst);

