/**
 * @file index.ts
 * @desc 遍历src/packages/文件夹，统计kgc组件被引用的次数
 */
import { parse, compileScript } from 'vue/compiler-sfc';
import path, { join } from 'path';
import fs, { Stats } from 'fs';
import traverse from '@babel/traverse';
import { parse as babelParse } from '@babel/parser';

// 整体流程
// 1.遍历文件夹
// 2.读取文件，ts文件直接读取，.vue文件，需要先parse转换，再获取import内容
// 3.获取import相关，且是从某个固定库引入的
// 4.返回对象 comImportedObj = {}; // 以组件为key，是个对象，projectName: 项目名，count: 在该组件中被引用了几次

interface ResultObj {
    // 组件名称为key; projectName为项目名
    [propName: string]: {
        [projectName: string]: {
            count: number;
        };
    };
}

/**
 * 
 * @desc 遍历文件夹中的文件
 * @param currentDirPath 文件夹路径
 * @param callback cb返回函数
 */
export function walkSync(currentDirPath: string, callback: (filePath: string, stat: Stats)=> void) {
    fs.readdirSync(currentDirPath).forEach(function (name: string) {
        const filePath = join(currentDirPath, name);
        const stat: Stats = fs.statSync(filePath);
        if(stat.isFile()) {
            callback(filePath, stat);
        } else if(stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

/**
 * 
 * @desc 预处理文件：如果.ts文件, 直接解析文件内容，并返回ast;
 * @desc 如果是.vue文件，需要先处理，获取script setup中的内容，然后解析并返回ast
 * @param filePath 文件路径
 * @returns 返回解析后的ast树
 */
function preHandleFile(filePath: string) {
    const fileInfo = path.parse(filePath);
    const codeStr = fs.readFileSync(filePath, 'utf-8');

    // 获取文件后缀
    const extType = fileInfo.ext;
    if(!['.ts', '.vue'].includes(extType)) {
        throw new Error('文件类型只能是ts | vue');
    }

    if(extType === '.ts' || extType === '.tsx') {
        return babelParse(codeStr, {
            allowImportExportEverywhere: true,
            sourceType: 'module',
            plugins: ['typescript']
        });
    }

    // parse，将文件内容解析为 template | script | scriptSetup | style
    const codeSFC = parse(codeStr, {
        filename: fileInfo.base
    });

    // 情况2: template + script setup
    // compileScript：将 script setup语法，解析为 jsx语法，即defineComponent
    if(codeSFC.descriptor?.scriptSetup) {
        const codeJsx = compileScript(codeSFC.descriptor, {
            // TODO: id
            id: 'test' // TOD: 获取style的id，用于 css scoped注入
        });
        return vue2Ast(codeJsx.content);
    }

    // 情况3: template + sctipt defineComonent
    const { script } = codeSFC.descriptor;
    if(script?.content) {
        return vue2Ast(script.content);
    }
}

/**
 * 
 * @desc 将vue中的script setup内容转换为 ast
 * @param content {string} 文件内容
 * @returns 返回ast
 */
function vue2Ast(content: string) {
    return babelParse(content, {
        allowImportExportEverywhere: true,
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
    });
}

/**
 * 
 * @desc 遍历ast树，统计组件被引用的次数
 * @param ast AST树
 * @param result 最终结果
 * @param projectPath 项目名
 */
function traverseAst(ast: any, result: ResultObj, projectPath: string) {
    traverse(ast, {
        ImportDeclaration(path) {
            if(path.node.source.value === 'library-name') {
                path.node.specifiers.forEach(item => {
                    // @ts-ignore
                    const comName = item?.imported?.name;
                    if(result[comName]) {
                        const cnt = result[comName][projectPath]?.count || 0;
                        result[comName][projectPath] = {
                            count: cnt + 1
                        };
                    } else {
                        result[comName] = {
                            [projectPath]: {
                                count: 1
                            }
                        };
                    }
                });
            }
        }
    });
}

/**
 * @desc 遍历src/文件夹，数组逐个遍历
 * @return { undefined | ResultObj } 遍历失败返回undefined
 */
export default function traverseSrc() {
    const comImportedObj: ResultObj  = {};
    console.log('⭐⭐⭐ 统计组件被引用次数--开始');
    try {
        const list = fs.readdirSync(path.resolve(__dirname, '../src/packages'));
    
        list.filter(item => item.indexOf('.') === -1).forEach(projectPath => {
            console.log('⭐⭐⭐ 当前统计项目 projectPath is', projectPath);
            walkSync(path.resolve(__dirname, `../src/packages/${projectPath}`), (filePath: string, stat: Stats) => {
                if(!['.ts', '.vue'].includes(path.extname(filePath))) {
                    return;
                }
                const ast = preHandleFile(filePath);
                if(ast) {
                    traverseAst(ast, comImportedObj, projectPath);
                }
            });
        });
    } catch(e) {
        console.log('⭐⭐⭐ 统计组件被引用次数--失败 e =', e);
        return;
    }
    console.log('⭐⭐⭐ 统计组件被引用次数--结束 comImportedObj =', comImportedObj);
    return comImportedObj;
}

const result = traverseSrc();
console.log('result = ', result);
