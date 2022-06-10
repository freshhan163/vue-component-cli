<template>
    <div class="avatar">
        <img v-if="user.avatar" :src="user.profile || user.avatar" :style="{ width: `${size}px`, height: `${size}px` }" :alt="user.name" />
        <div v-else class="img-default"></div>
        <!-- TODO safari下面backgroundSize 100%有问题，后面查一下原因 -->
        <span
            v-if="displayVerifiedSymbol"
            class="avatar-verified"
            :class="verifiedType"
            :style="{
                width: `${verifiedSize}px`,
                height: `${verifiedSize}px`,
                backgroundSize: `${verifiedSize}px ${verifiedSize}px`,
            }"
        ></span>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    size?: number, // 头像尺寸
    verifiedSize?: number, // 认证标志大小
    alt?: string, // 图片说明文字
    showVerified?: boolean, // 是否显示认证信息
    verified?: boolean, // 是否是认证用户
    user: any
}>(), {
    size: 0,
    verifiedSize: 0,
    alt: '',
    showVerified: false,
    verified: false,
    user: {}
});
const displayVerifiedSymbol = computed(() => props.showVerified && props.user.verifiedStatus?.verified && [4, 5, 6, 7, 8, 9, 10, 11].includes(props.user.verifiedStatus?.type))
const verifiedType = computed(() => {
    if ([4, 5, 7, 8, 9].includes(props.user.verifiedStatus?.type)) {
        return 'person';
    }
    return 'company';
});
</script>

<!-- <style lang="stylus" scoped>
.avatar
    position relative
    img
        border-radius 50%
        vertical-align top
    &-verified
        display block
        background-repeat no-repeat
        background-position center center
        position absolute
        right 0
        bottom 0
        &.person
            background url("./img/verified-person.svg")
        &.company
            background url("./img/verified-company.svg")
    .img-default
        display inline-block
        width 84px
        height 84px
        border-radius 50%
        vertical-align top
        background-color #DEDEDE
</style> -->
