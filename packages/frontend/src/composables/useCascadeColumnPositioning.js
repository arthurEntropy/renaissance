import { nextTick, ref } from 'vue'

const getDefaultViewportBounds = () => ({
    top: 8,
    bottom: typeof window === 'undefined' ? 0 : window.innerHeight - 8,
})

export function useCascadeColumnPositioning(options = {}) {
    const {
        columnKeys = [],
        getViewportBounds = getDefaultViewportBounds,
        getBaselineTop = () => getViewportBounds().top,
    } = options

    const columnOffsets = ref(Object.fromEntries(columnKeys.map((columnKey) => [columnKey, 0])))
    const columnAnchors = ref(Object.fromEntries(columnKeys.map((columnKey) => [columnKey, null])))
    const columnMaxHeights = ref(Object.fromEntries(columnKeys.map((columnKey) => [columnKey, null])))

    const clampTop = (preferredTop, height) => {
        const bounds = getViewportBounds()
        const minTop = bounds.top
        const maxTop = Math.max(minTop, bounds.bottom - height)
        return Math.min(Math.max(preferredTop, minTop), maxTop)
    }

    const clampTopFromCenter = (centerY, height) => clampTop(centerY - height / 2, height)

    const getColumnStyle = (columnKey) => {
        const style = { transform: `translateY(${columnOffsets.value[columnKey] || 0}px)` }
        const maxH = columnMaxHeights.value[columnKey]
        if (maxH != null) style.maxHeight = `${maxH}px`
        return style
    }

    const setColumnAnchor = (columnKey, anchorValue) => {
        columnAnchors.value[columnKey] = anchorValue
    }

    const positionColumnByTop = async (columnKey, columnRef, preferredTop, anchorValue = preferredTop) => {
        setColumnAnchor(columnKey, anchorValue)
        await nextTick()
        const element = columnRef.value
        if (!element || !Number.isFinite(preferredTop)) return

        const bounds = getViewportBounds()
        const top = clampTop(preferredTop, element.offsetHeight)
        columnOffsets.value[columnKey] = top - getBaselineTop()
        columnMaxHeights.value[columnKey] = Math.round(bounds.bottom - top)
    }

    const positionColumnByCenter = async (columnKey, columnRef, centerY) => {
        setColumnAnchor(columnKey, centerY)
        await nextTick()
        const element = columnRef.value
        if (!element || !Number.isFinite(centerY)) return

        const bounds = getViewportBounds()
        const top = clampTopFromCenter(centerY, element.offsetHeight)
        columnOffsets.value[columnKey] = top - getBaselineTop()
        columnMaxHeights.value[columnKey] = Math.round(bounds.bottom - top)
    }

    return {
        columnOffsets,
        columnAnchors,
        columnMaxHeights,
        getColumnStyle,
        setColumnAnchor,
        positionColumnByTop,
        positionColumnByCenter,
    }
}
