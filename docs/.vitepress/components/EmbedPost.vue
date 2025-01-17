<script setup lang="ts">
import { useData } from 'vitepress'

const { isDark } = useData()
const { link, height } = defineProps<{
    link: string
    height?: number
}>()
</script>

<template>
    <iframe :src="`https://t.me/${link}?embed=1&color=d990c3&dark=${+isDark}`" :height="height"></iframe>
</template>