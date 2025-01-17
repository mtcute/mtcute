<template>
    <span class="tag">
        {{ text }}
    </span>
</template>

<script>
export default {
    name: 'Tag',
    props: ['text'],
}
</script>

<style>
.tag {
    font-size: 0.4em;
    font-weight: 400;
    border: 1px solid var(--vp-c-default-3);
    padding: 2px 4px;
    border-radius: 6px;
    color: var(--vp-c-brand);
    vertical-align: middle;
}
</style>
