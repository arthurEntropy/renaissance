<template>
    <teleport to="body">
        <div v-if="overlay" class="cascade-overlay" @click.self="emitClose">
            <div ref="menuRootRef" class="cascade-menu cascade-menu--overlay" :style="menuStyle" @mousedown.stop
                @wheel.stop @mouseleave="$emit('mouseleave')" @mouseenter="$emit('mouseenter')">
                <slot />
            </div>
        </div>

        <div v-else ref="menuRootRef" class="cascade-menu" :style="menuStyle" @mousedown.stop @wheel.stop
            @mouseleave="$emit('mouseleave')" @mouseenter="$emit('mouseenter')">
            <slot />
        </div>
    </teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
    overlay: {
        type: Boolean,
        default: false,
    },
    anchorPosition: {
        type: Object,
        default: null,
    },
    closeOnOutsideClick: {
        type: Boolean,
        default: false,
    },
    anchorMode: {
        type: String,
        default: 'viewportTop',
    },
})

const emit = defineEmits(['close', 'mouseenter', 'mouseleave'])

const menuRootRef = ref(null)
const adjustedTop = ref(null)

const getViewportTop = () => {
    if (typeof window === 'undefined') return 0

    const navHeightValue = getComputedStyle(document.documentElement).getPropertyValue('--nav-height')
    const navHeight = Number.parseFloat(navHeightValue)
    return (Number.isFinite(navHeight) ? navHeight : 0) + 10
}

const menuStyle = computed(() => {
    if (props.anchorPosition?.x == null) return {}

    const usesAnchorY = props.anchorMode === 'anchorY' && Number.isFinite(props.anchorPosition?.y)
    const baseTop = usesAnchorY ? Math.round(props.anchorPosition.y) : getViewportTop()
    const top = adjustedTop.value ?? baseTop

    return {
        top: `${top}px`,
        left: `${props.anchorPosition.x}px`,
        bottom: 'auto',
        zIndex: 'var(--z-cascade-menu)',
    }
})

const clampToViewport = () => {
    const menu = menuRootRef.value
    if (!menu) return
    const rect = menu.getBoundingClientRect()
    const overflow = rect.bottom - (window.innerHeight - 8)
    if (overflow > 0) {
        adjustedTop.value = Math.max(getViewportTop(), Math.round(rect.top - overflow))
    }
}

watch(() => props.anchorPosition, () => {
    adjustedTop.value = null
})

const emitClose = () => {
    emit('close')
}

const handleDocumentPointerDown = (event) => {
    if (!props.closeOnOutsideClick) return
    const menuRoot = menuRootRef.value
    if (!menuRoot) return
    if (menuRoot.contains(event.target)) return
    emitClose()
}

onMounted(() => {
    document.addEventListener('pointerdown', handleDocumentPointerDown)
    nextTick(clampToViewport)
})

onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

<style scoped>
.cascade-menu {
    position: fixed;
    top: calc(var(--nav-height) + 10px);
    left: 0;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 3px;
    z-index: var(--z-cascade-menu) !important;
    padding: 6px;
    background: transparent;
    pointer-events: auto;
    overflow: visible;
}

.cascade-overlay {
    position: fixed;
    inset: 0;
    background: var(--overlay-black-medium);
    z-index: var(--z-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-lg);
}

.cascade-menu--overlay {
    align-items: flex-start;
}
</style>
