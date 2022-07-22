<template>
    <button
        :type="props.nativeType"
        :class="['btn', 'btn-' + props.type, 'btn-' + props.size, props.radius ? 'btn-radius' : '']"
        @click="click($event)"
    >
        <!-- 默认插槽 -->
        <slot></slot>
        <!-- test插槽 -->
        <slot name="btn-test"></slot>
    </button>
</template>

<script lang="ts">
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

export type ButtonSize = 'large' | 'normal' | 'small' | 'mini';

export default defineComponent({
    name: 'button',

    props: {
        text: String,
        icon: String,
        color: String,
        // block: Boolean,
        // plain: Boolean,
        // round: Boolean,
        // square: Boolean,
        // loading: Boolean,
        // hairline: Boolean,
        // disabled: Boolean,
        // iconPrefix: String,
        // loadingSize: String,
        // loadingText: String,
        tag: {
            type: String as PropType<keyof HTMLElementTagNameMap>,
            default: 'button',
        },
        type: {
            type: String as PropType<ButtonType>,
            default: 'default',
        },
        // size: {
        //     type: String as PropType<ButtonSize>,
        //     default: 'normal',
        // },
        // nativeType: {
        //     type: String as PropType<ButtonHTMLAttributes['type']>,
        //     default: 'button',
        // },
        // iconPosition: {
        //     type: String as PropType<'left' | 'right'>,
        //     default: 'left',
        // },
    },

    emits: ['click'],

    setup(props, { emit, slots }) {
        const renderIcon = () => {};

        const renderText = () => {
        let text;
        if (props.loading) {
            text = props.loadingText;
        } else {
            text = slots.default ? slots.default() : props.text;
        }

        if (text) {
            return <span class={bem('text')}>{text}</span>;
        }
        };

        const getStyle = () => {
            const { color, plain } = props;
            if (color) {
                const style: CSSProperties = {};

                style.color = plain ? color : 'white';

                if (!plain) {
                    // Use background instead of backgroundColor to make linear-gradient work
                    style.background = color;
                }

                // hide border when color is linear-gradient
                if (color.includes('gradient')) {
                    style.border = 0;
                } else {
                    style.borderColor = color;
                }

                return style;
            }
        };

        const onClick = (event: MouseEvent) => {
            if (props.loading) {
                event.preventDefault();
            }
            if (!props.loading && !props.disabled) {
                emit('click', event);
            }
        };

        return () => {
            const {
                tag,
                type,
                size,
                block,
                round,
                plain,
                square,
                loading,
                disabled,
                hairline,
                nativeType,
                iconPosition,
            } = props;

            const classes = [
                bem(type),
                bem(size)
            ];

            return (
                <tag
                    type={nativeType}
                    class={classes}
                    style={getStyle()}
                    disabled={disabled}
                    onClick={onClick}
                >
                    <div class={bem('content')}>
                        {iconPosition === 'left' && renderIcon()}
                        {renderText()}
                        {iconPosition === 'right' && renderIcon()}
                    </div>
                </tag>
            );
        };
    },
});
</script>