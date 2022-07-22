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

<script setup lang="ts">
const props = withDefaults(defineProps<{
    // @doc name of crud
    type?: string,
    size?: string,
    nativeType?: 'button' | 'submit',
    radius?: boolean,
}>(), {
    type: 'default',
    size: 'medium',
    nativeType: 'button',
    radius: false,
});

const emit = defineEmits<{
    // @doc click Events
    (e: 'click', event: any): void,
}>();

// @doc click函数
function click($event) {
    // click函数，$event参数
    emit('click', $event);
}
</script>

<style lang="less" scoped>
.name {
    color: pink;
}
</style>
