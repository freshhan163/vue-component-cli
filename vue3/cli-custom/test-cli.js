/**
 * @file test-cli.js
 * @desc 三种情况下vue组件的解析
 */

const { parse, compileScript, compileTemplate, babelParse, SFCDescriptor, SFCScriptCompileOptions } = require('vue/compiler-sfc');
const path = require('path');
const fs = require('fs');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

// 情况1：template + script setup（组合式API）
const source = fs.readFileSync(path.resolve(__dirname, '../src/button/index.vue'), 'utf-8');
// 返回descriptor.script.content
const parseSFC = parse(
    source,
    {
        filename: 'button.vue'
    }
);
// console.log('parseSFC.descriptor = \n', parseSFC.descriptor);

// 将script setup语法，转换为jsx语法
const scriptValue = compileScript(parseSFC.descriptor, {
    id: 'test',
    filename: 'button.vue'
});

// 生成的content，其实和.tsx文件很相似
console.log('scriptValue = \n', scriptValue); // content | scriptSetupAst（VariableDeclaration \ FunctionDeclaration）

console.log('jsx语法转为AST树 =', babelParseAst(scriptValue.content)); // 是jxs语法，defineComponent
// console.log('script setup 语法转为AST树 =', babelParseAst(parseSFC.descriptor.scriptSetup.content)); // 是 withDefaults等语法，直接转换也行，但是和上面的有一些行数不一样

// 情况2：template + defineComponent，parse以后，返回  descriptor.script.content
// const sourceVueJsx = fs.readFileSync(path.resolve(__dirname, 'src/button/button.vue'), 'utf-8');
// const parseVueJsx = parse(
//     sourceVueJsx,
//     {
//         filename: 'button.vue'
//     }
// );
// console.log('parseSFC.descriptor = \n', parseVueJsx.descriptor); // descriptor.script.content

// 情况3：读取jsx语法，然后转换为 AST树
// const tsxCode = fs.readFileSync(path.resolve(__dirname, 'src/button/button.tsx'), 'utf-8');

function babelParseAst(content) {
    return babelParse(content, {
        allowImportExportEverywhere: true,
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
    });
}

// const astCode = babelParseAst(tsxCode);
// console.log('直接转换jsx语法 = \n', astCode);
