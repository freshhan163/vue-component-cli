/**
 * @file index.js
 * @desc 使用vue/compiler-sfc库，解析文件
 */
const {
    parse,
    compileScript,
    compileTemplate,
    babelParse,
    SFCDescriptor,
    SFCScriptCompileOptions
} = require('vue/compiler-sfc');
const path = require('path');
const fs = require('fs');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

// TODO:
const docIdentifierReg = /[\s\W\D]*/g;
// const docIdentifierReg = /^[\s*]*?@doc/;

let scriptCode = '';

/**
 * 
 * @desc 将文件内容转换为jsx语法
 * @param {*} filePath 
 * @returns string
 */
function preHandleFile(filePath) {
    const fileInfo = path.parse(filePath);
    const codeStr = fs.readFileSync(filePath, 'utf-8');

    // 获取文件后缀，如果是.tsx | .jsx，直接返回
    const extType = fileInfo.ext;
    if (extType === '.jsx' || extType === '.tsx') {
        return codeStr;
    }

    // parse，将文件内容解析为 template | script | scriptSetup | style
    const codeSFC = parseSFC(codeStr, {
        filename: fileInfo.base
    });

    // 情况2: template + defineComonent
    const { script } = codeSFC.descriptor;
    if (script) {
        // console.log('script.content =', script.content);
        return script.content;
    }

    // TODO: id、filename
    // 情况3: template + script setup
    // compileScript：将 script setup语法，解析为 jsx语法，即defineComponent
    const codeJsx = compileScript(codeSFC.descriptor, {
        id: 'test',
        filename: 'button.vue'
    });
    // console.log('codeJsx.content = ', codeJsx.content);
    return codeJsx.content;
}

/**
 * 
 * @desc 将读取到的文件string，转换为 template、scriptSetup、style
 * @desc 返回内容为 descriptor.template.content; descriptor.scriptSetup.content
 * @param {string} content 
 * @param {*} options 
 * @returns 
 */
function parseSFC(content, options) {
    return parse(content, options);
}

/**
 * 
 * @desc 将script setup语法，转换为 AST树
 * @param {*} content 
 * @returns 
 */
function babelParseAst(content) {
    scriptCode = content;
    return babelParse(content, {
        allowImportExportEverywhere: true,
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
    });
}

/**
 * 
 * @desc 处理template
 * @param {string} source 
 * @param {id | name | slotted} options 
 * @returns 
 */
function handleTemplate(source, options) {
    return compileTemplate({
        id: 'test',
        filename: 'button.vue',
        source: parseValue.descriptor.template.content,
        slotted: true
    });
}

// TODO:需要了解 type
function astToJson(ast) {
    const json = {};
    traverse(ast, {
        CallExpression(p) {
            const callNode = p.node;
            // console.log('callNode = ', callNode);
            if (callNode.callee.name === 'defineComponent' || callNode.callee.name === '_defineComponent') {
                const argNode = callNode.arguments[0];
                argNode.properties.forEach((optionNode) => {
                    switch (optionNode.key.name) {
                        case 'props':
                            json.props = genProps(optionNode);
                            break;
                        case 'methods':
                            json.methods = genMethods(optionNode);
                            break;
                        case 'emits':
                            json.events = genEvents(optionNode);
                            break;
                        default:
                            break;
                    }
                });
            }
        },
    });
    return json;
}

function docToJson(filePath) {
    const code = preHandleFile(filePath);
    // console.log('code = ', code);
    const ast = babelParseAst(code);
    console.log(`${filePath} ast树 = \n`, ast);

    const json = astToJson(ast);
    console.log('ast树转换为json = \n', json);
    return json;
}

// 解析注释中的文档内容
function parseComment(commentNode) {
    const result = {};
    const {
        value
    } = commentNode;
    let lines = value.split(/\r?\n/);
    lines = lines.map((l) => l.trim().replace(/^\*\s*/, '')).filter((i) => !!i);
    lines.forEach((line) => {
        const [key, ...desc] = line.split(' ');
        const docKey = key.replace(/^@/, '').replace(/^doc/, 'desc');
        if (docKey === 'param') {
            const [paramName, ...paramDesc] = desc;
            const param = {
                name: paramName.trim(),
                desc: paramDesc.join(' ').trim(),
            };
            if (result.params) {
                result.params.push(param);
            } else {
                result.params = [param];
            }
        } else {
            result[docKey] = desc.join(' ').trim();
        }
    });
    return result;
}

// 根据 loc 截取字符;
function getLocContent(loc) {
    const lines = scriptCode.split(/\r?\n/).filter((lineContnt, index) => {
        return index >= loc.start.line - 1 && index <= loc.end.line - 1;
    });
    const lastIdx = lines.length - 1;
    if (lines.length === 1) {
        return lines[0].substring(loc.start.column, loc.end.column);
    }
    lines[0] = lines[0].substring(loc.start.column);
    lines[lastIdx] = lines[lastIdx].substring(0, loc.end.column);
    return lines.join(os.EOL);
}

// 提取事件文档
function genEvents(eventsNode) {
    const result = [];
    eventsNode.value.elements.forEach((node) => {
        if (node.leadingComments && node.leadingComments.length) {
            const commentNode = node.leadingComments[0];
            const descContent = commentNode.value.trim();
            if (docIdentifierReg.test(descContent)) {
                const prop = {
                    name: node.value,
                    ...parseComment(commentNode),
                };
                result.push(prop);
            }
        }
    });
    return result;
}

// 提取 props 文档
function genProps(propsNode) {
    const result = [];
    propsNode.value.properties.forEach((node) => {
        if (node.leadingComments && node.leadingComments.length) {
            const commentNode = node.leadingComments[0];
            const descContent = commentNode.value.trim();
            if (docIdentifierReg.test(descContent)) {
                const prop = {
                    name: node.key.name,
                    ...parseComment(commentNode),
                };
                node.value.properties.forEach((item) => {
                    const valueNode = item.value;
                    let value = valueNode.value ?? valueNode.name ?? valueNode.expression?.name;
                    if (valueNode.type === 'ArrowFunctionExpression') {
                        value = getLocContent(valueNode.body.loc);
                    } else {
                        value = getLocContent(valueNode.loc);
                    }
                    prop[item.key.name] = value;
                });
                result.push(prop);
            }
        }
    });
    return result;
}
// 提取 methods 文档
function genMethods(methodsNode) {
    const result = [];
    methodsNode.value.properties.forEach((node) => {
        if (node.leadingComments && node.leadingComments.length) {
            const commentNode = node.leadingComments[0];
            const descContent = commentNode.value.trim();
            if (docIdentifierReg.test(descContent)) {
                const method = {
                    name: node.key.name,
                    ...parseComment(commentNode),
                };
                result.push(method);
            }
        }
    });
    return result;
}

const codeVue = path.resolve(__dirname, '../src/button/index.vue');
const codeVueJsx = path.resolve(__dirname, '../src/button/button.vue');
const codeJsx = path.resolve(__dirname, '../src/button/button.tsx');

const docVueDemo = path.resolve(__dirname, '../src/docvue/index.vue');

// docToJson(codeVue);
// docToJson(codeVueJsx);
// docToJson(codeJsx);
docToJson(docVueDemo);

// TODO: @doc解析
// TODO: 纯vue文件，ast树如何解析呢，现在只能支持 template + JSX，和 纯JSX
