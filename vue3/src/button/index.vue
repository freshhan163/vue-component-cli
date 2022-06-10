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
    (e: 'click', event: any): void,
}>();

function click($event) {
    // click函数，$event参数
    emit('click', $event);
}
</script>

<style></style>
