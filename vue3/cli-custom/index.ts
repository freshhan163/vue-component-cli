/**
 * @file index.js
 * @desc 使用vue/compiler-sfc库，解析文件
 */
import {
    parse,
    compileScript,
    compileTemplate,
    babelParse,
    SFCDescriptor,
    SFCScriptCompileOptions,
    SFCParseOptions
} from 'vue/compiler-sfc';
import { astToJson } from './util';
import path from 'path';
import fs from 'fs';
const json2md = require("json2md");

/**
 * 
 * @desc 将文件内容转换为jsx语法
 * @param {*} filePath 
 * @returns string
 */
function preHandleFile(filePath: string) {
    const fileInfo = path.parse(filePath);
    const codeStr = fs.readFileSync(filePath, 'utf-8');

    // 获取文件后缀
    const extType = fileInfo.ext;

    if (!['.jsx', '.tsx', '.vue'].includes(extType)) {
        throw new Error('文件类型只能是jsx | tsx | vue');
    }

    // 如果是.tsx | .jsx，不需解析，直接返回
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

    // 情况3: .vue文件，template + script setup
    // compileScript：将 script setup语法，解析为 jsx语法，即defineComponent
    const codeJsx = compileScript(codeSFC.descriptor, {
        id: 'test'
    });
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
function parseSFC(content: string, options: SFCParseOptions) {
    return parse(content, options);
}

/**
 * 
 * @desc 将script setup语法，转换为 AST树
 * @param {*} content 
 * @returns 
 */
function babelParseAst(content: string) {
    return babelParse(content, {
        allowImportExportEverywhere: true,
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
    });
}

/**
 * 
 * @desc 输入文件路径，返回解析后的JSON信息
 * @param filePath 文件路径
 * @returns {JSON} 返回解析后的JSON信息
 */
function docToJson(filePath: string) {
    const code = preHandleFile(filePath);
    const ast = babelParseAst(code);

    const json = astToJson(ast, code);
    // console.log('ast树转换为json = \n', json);
    return json;
}

function genMd(json: any){
    const mdList: any = [];
    Object.keys(json).forEach(key => {
        mdList.push({h2: key});
        const docs = json[key];
        if(docs && docs.length) {
            const table: any = {rows: [], headers: []};
            mdList.push({table});
            switch (key) {
                case 'slots':
                case 'events':
                    table.headers = ['name','desc']
                    break;
                case 'props':
                    table.headers = ['name','type','desc','default','required']
                    break;
                case 'methods':
                    table.headers = ['name','desc','params','returns']
                    break;
                default:
                    break;
                }
            docs.forEach((doc: any) => {
                if(key === 'methods' && doc.params && doc.params.length) {
                    doc.params = doc.params.map((param: any) => {
                    return `${param.name}: ${param.desc}`
                    }).join('</br>')
                }
                doc.params = doc.params || '';
                doc.default = doc.default || '';
                doc.required = doc.required || '';
                doc.type = doc.type || '';
                doc.returns = doc.returns || '';
                table.rows.push(doc);
            });
        }
    });
    return json2md(mdList);;
}

export default function vueDoc(config = { type: 'json', filePath: '' }){
    if (!config.filePath) {
        throw new Error('filePath字段是必须字段');
    }
    if (!path.isAbsolute(config.filePath)) {
        throw new Error(`filePath路径必须要是绝对路径，传入的文件路径为${config.filePath}`);
    }

    const json = docToJson(config.filePath);
    switch (config.type) {
        case 'md':
            return genMd(json);
        default:
            return json;
    }
}

const codeVue = path.resolve(__dirname, '../src/button/index.vue');
vueDoc({ filePath: codeVue, type: 'md' });

// const codeVueJsx = path.resolve(__dirname, '../src/button/button.vue');
// vueDoc(codeVueJsx);

const codeJsx = path.resolve(__dirname, '../src/button/button.tsx');
console.log(vueDoc({ filePath: codeJsx, type: 'md' }));

// const docVueDemo = path.resolve(__dirname, '../src/docvue/index.vue');
// vueDoc(docVueDemo);

// TODO: 纯vue文件，ast树如何解析呢，现在只能支持 template + JSX，和 纯JSX