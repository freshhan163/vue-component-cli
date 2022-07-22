/**
 * @file test-template.js
 * @desc @babel/template库的使用
 */
const template = require('@babel/template').default;
const t = require('@babel/types');
const generate = require('@babel/generator').default;

// 方法一：纯字符串使用方法，变量声明支持两种形式 %%importName%% 小写形式 | 变量名全大写形式
const fn = template(`
    var IMPORT_NAME = require(SOURCE);
`);

const ast = fn({
    IMPORT_NAME: t.identifier("myModule"),
    SOURCE: t.stringLiteral("my-module"),
});
console.log('纯字符串模式 + 占位符 template生成代码 \n', generate(ast).code);

// template.ast：如果没有占位符，只是想将 纯粹的string code 转换为 AST树，可直接使用 template.ast
const astStr = template.ast(`
    var myModule = require("my-module");
`);
console.log('纯粹的字符串 template.ast \n', generate(astStr).code);


// 方法2：字符串模板： %%语法 | 变量占位符
console.log('************第二种用法 字符串模板********************');
const source = "my-module";
const fn3 = template(`
    var IMPORT_NAME = require('${source}');
`);

const ast3 = fn3({
    IMPORT_NAME: t.identifier("myModule"),
});

console.log('字符串模板 + 占位符 template生成代码 \n', generate(ast3).code); // var myModule = require('my-module');

// 字符串模板占位符： `${source}`
const name = "my-module";
const mod = "myModule";

const ast4 = template.ast`
    var ${mod} = require("${name}");
`;
console.log('字符串模板 生成代码 \n', generate(ast4).code); // var myModule = require('my-module');