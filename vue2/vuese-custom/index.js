// 导入 parser 函数
const { parser } = require('@vuese/parser');
const fs = require('fs');
const path = require('path');

console.log('path = ', path.resolve(__dirname, '../src/button/index.vue'));

// 读取 vue 文件内容
const source = fs.readFileSync(path.resolve('src/button/index.vue'), 'utf-8')

// 使用 parser 函数解析并得到结果
try {
    const parserRes = parser(source);
    // console.log('parserRes = \n', parserRes);
} catch(e) {
    console.error(e)
}

// 情况2：针对jsx文件
const jsxSource = fs.readFileSync(path.resolve('src/button/button.tsx'), 'utf-8');
console.log('jsxSource = \n', jsxSource);

try {
    const parserJsxRes = parser(jsxSource);
    console.log('jsxSource = \n', parserJsxRes);
} catch(e) {
    console.error(e)
}