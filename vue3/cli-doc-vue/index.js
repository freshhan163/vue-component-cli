/**
 * @file index.js
 * @desc 使用doc-vue库，解析vue（template + defineComponent）文件
 */
const docvue = require('doc-vue');
const path = require('path');
const fs = require('fs');

const code = fs.readFileSync(path.resolve(__dirname, '../src/docvue/index.vue'), 'utf-8');

const result = docvue(code);  // by default, result is json object
console.log('result = ', result);
// const mdResult = docvue(code, {type: 'md'});  // mdResult is markdown string
// const htmlResult = docvue(code, {type: 'html'});  // htmlResult is html string
// console.log('mdResult = ', mdResult);
