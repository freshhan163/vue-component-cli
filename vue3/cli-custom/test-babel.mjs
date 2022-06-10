const testJsFile = fs.readFileSync(path.resolve(__dirname, './test.js'), 'utf-8');

const babelParseValue = require("@babel/parser").parse(testJsFile);

// console.log('babelParseValue =', babelParseValue);

// 读取文档信息，使用 @babel/traverse，遍历ast的节点
const _traverse = require('@babel/traverse');
const traverse = _traverse.default;

traverse(babelParseValue, {
    enter(path) {
        if (path.isIdentifier({ name: "a" })) {
            path.node.name = "x";
        }
    },
    FunctionDeclaration: function(path) {
        path.node.id.name = "fx";
    },
});

// 输出信息
const generate = require('@babel/generator').default;
const output = generate(babelParseValue, {}, testJsFile);
console.log('output = ', output);