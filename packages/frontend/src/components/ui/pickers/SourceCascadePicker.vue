<template>
    <button ref="triggerRef" :id="id" type="button" :class="[selectClass, 'source-cascade-trigger']"
        :aria-expanded="showPicker" @click="toggleFromTrigger">
        <span class="source-cascade-label" :class="{ 'is-placeholder': !modelValue }">{{ displayLabel }}</span>
        <span class="source-cascade-chevron">▾</span>
    </button>

    <CascadeMenuFrame v-if="showPicker" :overlay="false" :anchor-position="anchorPosition"
        :close-on-outside-click="true" anchor-mode="anchorY" @close="closePicker" @mouseleave="handleMouseLeave"
        @mouseenter="handleMouseEnter">
        <div class="source-cascade-menu">
            <div ref="sourceTypeColRef" class="cascade-col" :style="getColumnStyle('sourceType')">
                <div class="cascade-item-wrap" v-for="sourceType in sourceTypeOptions" :key="sourceType.id"
                    :class="{ active: pickerSelectedSourceType === sourceType.id }"
                    @mouseenter="handleHoverSourceType(sourceType, $event)">
                    <button class="cascade-btn" tabindex="-1">
                        <span class="cascade-btn-label">{{ sourceType.label }}</span>
                        <span class="cascade-chevron">›</span>
                        <span class="cascade-count">{{ sourceType.count }}</span>
                    </button>
                </div>
            </div>

            <div ref="sourceColRef" class="cascade-col cascade-col--sources" :style="getColumnStyle('source')"
                v-if="pickerSelectedSourceType">
                <input v-model="pickerSearch" class="cascade-search" placeholder="Search sources…"
                    @keydown.escape="closePicker" />
                <div class="cascade-items-list" v-if="pickerCurrentSources.length > 0 || showGroupOptions">
                    <div v-if="showGroupOptions" class="cascade-item-wrap cascade-item-wrap--action"
                        @click="selectSourceTypeGroup(pickerSelectedSourceType)">
                        <button class="cascade-btn cascade-btn--action" tabindex="-1">
                            <span class="cascade-btn-label">All {{ selectedSourceTypeLabel }}</span>
                        </button>
                    </div>
                    <div v-if="showGroupOptions" class="cascade-col-divider" />
                    <div class="cascade-item-wrap cascade-item-wrap--leaf" v-for="source in pickerCurrentSources"
                        :key="source.id" @click="selectSource(source.id)">
                        <button class="cascade-btn cascade-btn--leaf" tabindex="-1">
                            <span class="cascade-btn-label">{{ source.name }}</span>
                        </button>
                    </div>
                </div>
                <div class="cascade-empty" v-else>
                    <span>No matching sources.</span>
                </div>
            </div>
        </div>
    </CascadeMenuFrame>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import CascadeMenuFrame from '@/components/ui/pickers/CascadeMenuFrame.vue'
import { useAnchoredPickerTrigger } from '@/composables/useAnchoredPickerTrigger'
import { useCascadeColumnPositioning } from '@/composables/useCascadeColumnPositioning'
import { useSourceCascadePicker } from '@/composables/useSourceCascadePicker'
import { useSourcesStore } from '@/stores/sourcesStore'

const props = defineProps({
    id: {
        type: String,
        default: 'source',
    },
    modelValue: {
        type: String,
        default: '',
    },
    placeholder: {
        type: String,
        default: '-- Select Source --',
    },
    selectClass: {
        type: String,
        default: 'modal-input',
    },
    showGroupOptions: {
        type: Boolean,
        default: false,
    },
    closeOnMouseLeave: {
        type: Boolean,
        default: false,
    },
    closeOnScroll: {
        type: Boolean,
        default: true,
    },
})

const emit = defineEmits(['update:modelValue'])

const sourcesStore = useSourcesStore()
const sourceTypeColRef = ref(null)
const sourceColRef = ref(null)

const {
    showPicker,
    pickerSearch,
    pickerSelectedSourceType,
    sourceTypeOptions,
    pickerCurrentSources,
    openPicker,
    closeCascadeImmediate,
    onHoverSourceType,
    startCloseMenu,
    cancelCloseMenu,
} = useSourceCascadePicker()

const {
    triggerRef,
    anchorPosition,
    toggleFromTrigger,
    closePicker,
    syncAnchorPosition,
} = useAnchoredPickerTrigger({
    isOpenRef: showPicker,
    onOpen: openPicker,
    onClose: closeCascadeImmediate,
    closeOnScroll: props.closeOnScroll,
})

const sourceTypeLabelMap = computed(() => sourceTypeOptions.value.reduce((acc, type) => {
    acc[type.id] = type.label
    return acc
}, {}))

const selectedSourceTypeLabel = computed(() => sourceTypeLabelMap.value[pickerSelectedSourceType.value] || 'Sources')

const displayLabel = computed(() => {
    if (!props.modelValue) return props.placeholder
    if (props.modelValue.startsWith('type:')) {
        const sourceType = props.modelValue.slice(5)
        const typeLabel = sourceTypeLabelMap.value[sourceType]
        return typeLabel ? `All ${typeLabel}` : props.placeholder
    }

    return sourcesStore.getSourceName(props.modelValue)
})

const getViewportBounds = () => ({
    top: 8,
    bottom: window.innerHeight - 8,
})

const {
    getColumnStyle,
    positionColumnByTop,
    positionColumnByCenter,
} = useCascadeColumnPositioning({
    columnKeys: ['sourceType', 'source'],
    getViewportBounds,
    getBaselineTop: () => anchorPosition.value?.y ?? getViewportBounds().top,
})

const positionSourceTypeColumn = async () => {
    const preferredTop = anchorPosition.value?.y
    await positionColumnByTop('sourceType', sourceTypeColRef, preferredTop, preferredTop)
}

const positionSourceColumn = async (centerY) => {
    await positionColumnByCenter('source', sourceColRef, centerY)
}

const selectSource = (sourceId) => {
    emit('update:modelValue', sourceId)
    closePicker()
}

const selectSourceTypeGroup = (sourceType) => {
    emit('update:modelValue', `type:${sourceType}`)
    closePicker()
}

const handleHoverSourceType = (sourceType, event) => {
    onHoverSourceType(sourceType)
    const rect = event?.currentTarget?.getBoundingClientRect?.()
    const centerY = rect ? rect.top + rect.height / 2 : (anchorPosition.value?.y + 40)
    void positionSourceColumn(centerY)
}

watch(
    () => showPicker.value,
    (isOpen) => {
        if (!isOpen) return

        syncAnchorPosition()
        void positionSourceTypeColumn()
    }
)

watch(
    () => pickerSelectedSourceType.value,
    () => {
        if (!showPicker.value) return
        const fallbackY = anchorPosition.value?.y ?? getViewportBounds().top
        void positionSourceTypeColumn()
        void positionSourceColumn(fallbackY + 40)
    }
)

watch(
    () => pickerCurrentSources.value.length,
    () => {
        if (!showPicker.value) return
        const fallbackY = anchorPosition.value?.y ?? getViewportBounds().top
        void positionSourceColumn(fallbackY + 40)
    }
)

const handleMouseLeave = () => {
    if (props.closeOnMouseLeave) {
        startCloseMenu()
    }
}

const handleMouseEnter = () => {
    if (props.closeOnMouseLeave) {
        cancelCloseMenu()
    }
}
</script>

<style scoped>
@import '@/styles/cascade-picker.css';

.source-cascade-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
    width: 100%;
    text-align: left;
    cursor: pointer;
    font-family: var(--font-family-primary) !important;
}

.source-cascade-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.source-cascade-menu {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 3px;
}

.source-cascade-label.is-placeholder {
    color: var(--color-text-muted);
}

.source-cascade-chevron {
    color: var(--color-text-muted);
    font-size: var(--font-size-11);
}

.cascade-col--sources {
    width: 240px;
}

.cascade-item-wrap--action {
    margin: 0 4px;
}
</style>
