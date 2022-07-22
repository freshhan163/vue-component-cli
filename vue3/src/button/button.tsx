import {
    PropType,
    CSSProperties,
    defineComponent,
    ButtonHTMLAttributes,
} from 'vue';

function bem(name: string) {
    return `button__${name}`
}

export type ButtonType =
| 'default'
| 'primary'
| 'success'
| 'warning'
| 'danger';

export interface ButtonInt {
    hxf: string;
    age: number;
}

export type ButtonSize = 'large' | 'normal' | 'small' | 'mini';

export default defineComponent({
    name: 'button',

    props: {
        // 文本
        text: String,
        // 图标
        icon: String,
        // 颜色
        color: String,
        // 是否是block
        block: Boolean,
        // 标签
        tag: {
            type: String,
            default: 'abbr-tag',
        },
        // 类型
        type: {
            type: String as PropType<ButtonType>,
            default: 'default',
        },
        // // 尺寸
        // size: {
        //     type: String as PropType<ButtonSize>,
        //     default: 'normal',
        // },
        // nativeType: {
        //     type: String as PropType<ButtonHTMLAttributes['type']>,
        //     default: 'button',
        // },
        // icon位置信息
        iconPosition: {
            type: String as PropType<'left' | 'right'>,
            default: 'left',
        },
    },

    emits: [
        // 测试click
        'click',
        'blur',
        'rendered',
        'update:show',
        'update:active',
        'update:modelValue',
        'scroll',
        'show',
        'hide'
    ],

    setup(props, { emit, slots }) {
        // text定义
        const { text } = props;

        // @func 渲染Icon函数
        const renderIcon = () => {};

        // @func renderText函数
        const renderText = () => {
            let text;
            // deault相关描述
            text = slots.default ? slots.default() : props.text;

            // header插槽相关描述
            let test = slots.header ? slots.header() : '';

            if (text) {
                return <span class={bem('text')}>{text} {test}</span>;
            }
        };

        // getStyle函数
        const getStyle = () => {
            const { color } = props;
            if (color) {
                const style: CSSProperties = {};

                // hide border when color is linear-gradient
                if (color.includes('gradient')) {
                    style.border = 0;
                } else {
                    style.borderColor = color;
                }

                return style;
            }
        };

        // @func testCli函数
        function testCli() {
            console.log('测试函数');
            // text是字符串类型的参数
            // emit('click', text);
        }

        // @func onClick
        const onClick = (event: MouseEvent) => {
            // if (props.loading) {
            //     event.preventDefault();
            // }
            if (!props.type) {
                // event是事件
                emit('click', event);
            }
            // // blur函数
            emit('blur');
            // rendered函数
            emit('rendered', '测试函数');
            // update:active
            emit('update:active', 'update:active');
            // update:modelValue
            emit('update:modelValue', 'modelValue');
            // scroll事件
            emit('scroll', {
                name: 'hxf',
                age: 22,
            });

            // 测试update:show
            props.type && emit('update:show', false);

            let a: 'show' = 'show';
            // 测试 emita
            emit(a);

            // emit中是个计算式
            emit(a === 'show' ? 'show' : 'hide');
        };

        // 测试return评论
        return () => {
            const {
                tag,
                // type,
                // size,
                // block,
                // round,
                // plain,
                // square,
                // loading,
                // disabled,
                // hairline,
                // nativeType,
                iconPosition,
            } = props;

            // const classes = [
            //     bem(type),
            //     bem(size)
            // ];

            return (
                <div
                    // type={nativeType}
                    class="test-tag"
                    style={getStyle()}
                    // disabled={disabled}
                    onClick={onClick}
                >
                    <slot name="header"></slot>
                    {/* <div class={bem('content')}>
                        {iconPosition === 'left' && renderIcon()}
                        {renderText()}
                        {iconPosition === 'right' && renderIcon()}
                        <slot name="header"></slot>
                    </div> */}
                </div>
            );
        };
    },
});
