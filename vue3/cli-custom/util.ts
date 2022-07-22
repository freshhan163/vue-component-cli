/**
 * @file util.js
 * @desc AST树解析相关的函数
 */
import path from 'path';
import fs from 'fs';
import os from 'os';
import traverse from '@babel/traverse';

// TODO: 评论信息，如何获取？
const docIdentifierReg = /[\s\W\D]*/g;
// const docIdentifierReg = /^[\s*]*?@doc/;

// TODO: 1.如何确定slot的描述信息呢？ 2. template模板中的slot如何获取呢？
function getSlotsFromCallExpression(path: any, json: any) {
    json.slots.push({
        name: path.node.callee.property.name,
        desc: '-'
    });
}

// 获取emits
function getEmitsFromCallExpression(path: any, json: any) {
    let commentNode: any = [];

    // 获取comments, CallExpression节点中没有comment
    let parentNode;
    path.findParent((p: any, cb: any) => {
        if (p.type === 'ExpressionStatement') {
            // console.log('parent path = ', p.node);
            commentNode = p.node.leadingComments;
            parentNode = p;
            return true;
        }
        return false;
    });

    const args = path.node.arguments;
    const commentLen = commentNode?.length;

    let emitName = '';

    switch (args[0].type) {
        case 'StringLiteral':
            // args[0]是string
            emitName = args[0].value;
            break;
        case 'Identifier':
            // 变量，如何获取: type === 'Identifier', args[0].name
            // @ts-ignore
            emitName = parentNode?.scope.getBinding(args[0]?.name)?.path?.node?.init?.value;
            console.log('变量 binding emitName = ', emitName);
            break;
        case 'ConditionalExpression':
            break;
        default:
            // 还有一种类型...
            // emit(`test-${props.type}`)
            break;
    }

    // 去重
    if (emitName && !(json.events.find((item: any) => item.name === 'emitName'))) {
        json.events.push({
            name: emitName,
            desc: commentLen > 0 ? commentNode[commentLen - 1]?.value : '--',
            // TODO: 获取参数的ts类型，对象的话，
            args: args.slice(1)?.map((item: any) => item?.value) || '类型待定'
        });
    }
}

// TODO:需要了解 type
function astToJson(ast: any, scriptCode: any) {
    const json: any = {
        props: [],
        // emit事件
        events: [],
        // 方法，提供给Ref使用
        methods: [],
        slots: []
    };

    traverse(ast, {
        CallExpression(path: any) {
            const calleeName = path.get('callee').toString();
            console.log('calleeName =', calleeName);

            // 获取slot
            if (calleeName.indexOf('slots.') > -1 && path.node.callee?.property?.name) {
                getSlotsFromCallExpression(path, json);
            }

            // 获取emit
            if (calleeName === 'emit' && path.node.arguments.length > 0) {
                getEmitsFromCallExpression(path, json);
            }

            // 获取Props
            // scriptSetup --> jsx后，calleeName = _defineComponent
            if (['defineComponent', '_defineComponent'].includes(calleeName)) {
                const callNode = path.node;
                const argNode = callNode.arguments[0];
                // properties包含4个内容 （name | props | emits） = 'ObjectProperty', setup是 'ObjectMethod'类型
                argNode.properties.forEach((optionNode: any) => {
                    switch (optionNode.key.name) {
                        case 'props':
                            json.props = genProps(optionNode, scriptCode);
                            break;
                        // case 'setup':
                            // console.log('optionNode =', optionNode);
                            // genSetup(optionNode, json);
                            // break;
                        default:
                            break;
                    }
                });
            }
        },
        // TODO:获取返回的template，执行它，得到slot
        // ReturnStatement(p: any) {
            // let slotTemplate = [];
            // console.log('path.node =', path.node);

            // if (p.node.argument.type === 'JSXElement') {
            //     const traverseJsxElement = (path: any) => {
            //         if (path.node?.argument.openingElement?.name?.name === 'slot') {
            //             console.log('遍历到了slot')
            //             slotTemplate.push({
            //                 name: 'slot'
            //             });
            //         }
            //         path.node.argument.children.forEach((item: any) => traverseJsxElement(item));
            //     }
            //     console.log('path.node.name =', p.node.argument);
            //     traverseJsxElement(p);
            // }
        // }
    });
    return json;
}

// 根据 loc 截取字符
function getLocContent(loc: any, scriptCode: any) {
    const lines = scriptCode.split(/\r?\n/).filter((lineContnt: any, index: any) => {
        return index >= loc.start.line - 1 && index <= loc.end.line - 1;
    });
    const lastIdx = lines.length - 1;
    if (lines.length === 1) {
        return lines[0].substring(loc.start.column, loc.end.column);
    }
    // 开始行的开始列
    lines[0] = lines[0].substring(loc.start.column);
    // 结束行的结束列
    lines[lastIdx] = lines[lastIdx].substring(0, loc.end.column);
    return lines.join((os as any).EOL); // os.EOL 操作系统特定的行尾标记。
}

// 从emit属性获取，提取事件文档
// @ts-ignore
function genEvents(eventsNode) {
    const result: any = [];
    eventsNode.value.elements.forEach((node: any) => {
        const len = node?.leadingComments?.length || 0;
        if (len === 0) {
            return;
        }
        const commentNode = node.leadingComments[len - 1];
        const prop = {
            name: node.value,
            ...parseComment(commentNode),
        };
        result.push(prop);
    });
    // console.log('events result = ', result);
    return result;
}

// TODO: 是否存在v-model，根据 emit的事件是否存在update开头的事件，并且事件名和属性名相同 + props中是否存在value属性，
// 提取 props 文档
// @ts-ignore
function genProps(propsNode, scriptCode) {
    const result: any = [];
    console.log('propsNode.value?.properties =', propsNode.value?.properties);
    propsNode.value?.properties.forEach((node: any) => {
        const len = node?.leadingComments?.length || 0;
        // 必须要包含注释，没有注释则不收集props
        if (len === 0) {
            return;
        }

        // 当前prop的key
        const nodeName = node.key.name;

        // 只取Props定义上，上面一行的评论
        const commentNode = node?.leadingComments[len - 1];
        const prop: any = {
            name: nodeName,
            desc: '',
            default: '-',
            type: '-',
            ...parseComment(commentNode),
        };
        // console.log('node.key.name - ', node.key.name, 'node.value.properties = \n', node.value?.properties);
        // 获取prop的默认值 | ts类型
        if (node.value?.properties?.length > 0) {
            // 针对复杂定义类型  { default: '', type: '' }
            node.value.properties.forEach((item: any) => {
                // 获取默认值
                if (item.key.name === 'default') {
                    prop.default = item.value.value;
                } else if (item.key.name === 'type') {
                    // console.log('item.value = ', item.value);
                    // 获取ts类型 TODO: 针对PropType应该再解析一下？？？
                    // const { value, name, type, body, loc, expression } = item.value;
                    // let tsType = value ?? name ?? expression?.name;
                    // if (type === 'ArrowFunctionExpression') {
                    //     tsType = getLocContent(body.loc, scriptCode);
                    // } else {
                    //     tsType = getLocContent(loc, scriptCode);
                    // }
                    const tsType = resolveType(item.value);
                    prop.type = tsType;
                }
            });
        } else {
            // 针对简单定义类型 text: String
            prop.type = node.value.name.toLowerCase();
        }
        result.push(prop);
    });
    // console.log('props result = ', result);
    return result;
}

function resolveType(tsType: any) {
    const typeNotation = tsType?.type;
    if (typeNotation === 'Identifier') {
        return tsType.name.toLowerCase();
    }
    // TSTypeAnnotation例子是什么？如何处理？
    // 先处理TSAsExpression
    if (typeNotation !== 'TSAsExpression') {
        return;
    }
    // TODO: 需要获取 ButtonType定义的地方，拿到数据，然后返回
    // console.log('tsType.typeAnnotation =', tsType.typeAnnotation.typeParameters.params);
    return tsType.expression.name.toLowerCase() || '';

    // switch (tsType.typeAnnotation.type) {
    //     case 'TSStringKeyword':
    //         return 'string';
    //     case 'TSNumberKeyword':
    //         return 'number';
    //     case 'TSBooleanKeyword':
    //         return 'boolean';
    //     default:
    //         return;
    // }
}

// @ts-ignore
// function genSetup(setupNode, json) {
//     const result: any = [];
//     setupNode.body?.body?.forEach((node: any) => {
//         const len = node.leadingComments.length;
//         if (len === 0) {
//             return;
//         }
//         switch (node.type) {
//             // TODO: 渲染函数：ReturnStatement
//             case 'ReturnStatement':
//                 // console.log('node = ', node.argument.body.body);
//                 node.argument.body?.body.forEach((item: any) => {
//                     if (item.type === 'ReturnStatement') {
//                         // console.log('item.argument = ', item.argument);
//                     }
//                 });
//                 break;
//             // function函数，FunctionDeclaration
//             case 'FunctionDeclaration':
//                 // console.log('node = ', node);
//                 // 普通function函数
//                 // 函数名：node.id.name
//                 // 函数体：node.body.body
//                 break;
//             // const函数， VariableDeclaration
//             // props等定义，VariableDeclaration
//             case 'VariableDeclaration':
//                 // 箭头函数
//                 // node.id.name
//                 // node.init?.type === 'ArrowFunctionExpression' // 箭头函数
//                 break;
//             default:
//                 break;
//         }
//     });
//     return result;
// }

// 解析注释中的文档内容: 单行注释（CommentLine）、多行注释（CommentBlock）
// @ts-ignore
function parseComment(commentNode) {
    const result: any = {};
    const {
        value
    } = commentNode;
    let lines = value.split(/\r?\n/);
    lines = lines.map((l: any) => l.trim().replace(/^\*\s*/, '')).filter((i: any) => !!i);
    lines.forEach((line: any) => {
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
            // result[docKey] = desc.join(' ').trim();
            result.desc = docKey.trim();
        }
    });
    return result;
}

/**
 * 
 * @desc 处理template
 * @param {string} source 
 * @param {id | name | slotted} options 
 * @returns 
 */
// @ts-ignore
function handleTemplate(source, options) {
    // return compileTemplate({
    //     id: 'test',
    //     filename: 'button.vue',
    //     // @ts-ignore
    //     source: parseValue?.descriptor.template.content,
    //     slotted: true
    // });
}

export { astToJson };
