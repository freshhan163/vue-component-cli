const fs = require('fs');
const path = require('path');
const traverse = require('@babel/traverse').default;
const { parse } = require("@babel/parser");
const generate = require('@babel/generator').default;
const { parseComponent } =  require('vue-template-compiler');

// 源码
const source = fs.readFileSync(path.resolve('src/button/index.vue'), 'utf-8');
// 解析为 template | script
const code = parseComponent(source);
console.log('script code = ', code.script.content);
// console.log('template code = ', code.template.content);

// 解析js代码为 ast树
const jsAst = parse(code.script.content, {
    sourceType: 'module'
});
console.log('jsAst = ', jsAst);

traverse(jsAst);

const output = generate(jsAst, {}, code);
console.log('output = ', output);
