import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'

const STORAGE_KEY = 'vtt-tabletop-state'
const MIN_SCALE = 0.15
const MAX_SCALE = 3
const MAX_HISTORY = 50
// Tags whose presence in the event path should suppress card dragging
const INTERACTIVE_TAGS = new Set(['button', 'a', 'input', 'select', 'textarea', 'label'])
// Used for rubber-band hit-testing as a fallback before the DOM ref is available
const CARD_APPROX_WIDTH = 300

export function useTabletopCanvas() {
    const abilitiesStore = useAbilitiesStore()
    const equipmentStore = useEquipmentStore()

    // Canvas items
    const canvasItems = ref([])

    const resolvedItemMap = computed(() => {
        const map = new Map()
        for (const item of canvasItems.value) {
            if (item.type === 'ability') {
                map.set(item.id, abilitiesStore.getById(item.itemId) ?? null)
            } else {
                map.set(item.id, equipmentStore.getById(item.itemId) ?? null)
            }
        }
        return map
    })

    // O(1) item lookup used by the drag hot-path
    const canvasItemsById = computed(() => {
        const map = new Map()
        for (const item of canvasItems.value) map.set(item.id, item)
        return map
    })

    // Canvas transform
    const transform = ref({ x: 0, y: 0, scale: 1 })

    const canvasTransformStyle = computed(() => ({
        transform: `translate(${transform.value.x}px, ${transform.value.y}px) scale(${transform.value.scale})`,
    }))

    // Snap to grid
    const snapToGrid = ref(true)
    const gridSize = ref(40)

    const snap = (val) => snapToGrid.value ? Math.round(val / gridSize.value) * gridSize.value : val

    const canvasGridStyle = computed(() => {
        const size = gridSize.value * transform.value.scale
        const ox = transform.value.x % size
        const oy = transform.value.y % size
        return {
            backgroundSize: `${size}px ${size}px`,
            backgroundPosition: `${ox}px ${oy}px`,
        }
    })

    const toggleSnap = () => { snapToGrid.value = !snapToGrid.value }
    const increaseGridSize = () => { gridSize.value = Math.min(200, gridSize.value + 10) }
    const decreaseGridSize = () => { gridSize.value = Math.max(10, gridSize.value - 10) }

    // Per-card visibility state
    const improvementsVisible = ref({})
    const successesVisible = ref({})

    const getImprovementsVisible = (id) => improvementsVisible.value[id] ?? false
    const setImprovementsVisible = (id, val) => (improvementsVisible.value = { ...improvementsVisible.value, [id]: val })
    const getSuccessesVisible = (id) => successesVisible.value[id] ?? false
    const setSuccessesVisible = (id, val) => (successesVisible.value = { ...successesVisible.value, [id]: val })

    // DOM refs
    const canvasContainerRef = ref(null)

    // Multi-select state
    const selectedIds = ref(new Set())
    // Rubber-band rect in canvas-container px ({ x1, y1, x2, y2 }); null when inactive
    const selectionRectangle = ref(null)
    // shallowRef so property mutations (currentPositions, etc.) don't trigger Vue reactivity
    const multiDragState = shallowRef(null)

    // Dynamic refs to card DOM elements, keyed by canvas-item id
    const cardElementRefs = new Map()
    const registerCardRef = (id, el) => {
        if (el) cardElementRefs.set(id, el)
        else cardElementRefs.delete(id)
    }

    const isSelected = (id) => selectedIds.value.has(id)

    // Cards that would be selected if the rubber-band drag ended right now.
    // Computed reactively so the template highlights them during the drag.
    const pendingSelectionIds = computed(() => {
        if (!selectionRectangle.value) return new Set()
        const { x1, y1, x2, y2 } = selectionRectangle.value
        const minX = Math.min(x1, x2)
        const maxX = Math.max(x1, x2)
        const minY = Math.min(y1, y2)
        const maxY = Math.max(y1, y2)
        const { x: tx, y: ty, scale } = transform.value
        const selMinX = (minX - tx) / scale
        const selMaxX = (maxX - tx) / scale
        const selMinY = (minY - ty) / scale
        const selMaxY = (maxY - ty) / scale
        const result = new Set()
        for (const item of canvasItems.value) {
            const el = cardElementRefs.get(item.id)
            const cardWidth = el ? el.offsetWidth : CARD_APPROX_WIDTH
            const cardHeight = el ? el.offsetHeight : 0
            if (
                item.x + cardWidth > selMinX &&
                item.x < selMaxX &&
                item.y + cardHeight > selMinY &&
                item.y < selMaxY
            ) {
                result.add(item.id)
            }
        }
        return result
    })

    const isPendingSelection = (id) => pendingSelectionIds.value.has(id)

    const toggleSelection = (id) => {
        const next = new Set(selectedIds.value)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        selectedIds.value = next
    }

    const clearSelection = () => {
        if (selectedIds.value.size > 0) selectedIds.value = new Set()
    }

    // Undo / Redo
    const _undoStack = []
    const _redoStack = []
    const _undoCount = ref(0)
    const _redoCount = ref(0)

    const canUndo = computed(() => _undoCount.value > 0)
    const canRedo = computed(() => _redoCount.value > 0)

    const _snapshot = () => JSON.parse(JSON.stringify(canvasItems.value))

    const recordSnapshot = () => {
        _undoStack.push(_snapshot())
        if (_undoStack.length > MAX_HISTORY) _undoStack.shift()
        _undoCount.value = _undoStack.length
        _redoStack.length = 0
        _redoCount.value = 0
    }

    const _restoreItems = (items) => {
        canvasItems.value = items
        topZIndex.value = items.length > 0 ? Math.max(...items.map(i => i.zIndex ?? 0)) : 1
        clearSelection()
        saveState()
    }

    const undo = () => {
        if (!_undoStack.length) return
        _redoStack.push(_snapshot())
        _redoCount.value = _redoStack.length
        _restoreItems(_undoStack.pop())
        _undoCount.value = _undoStack.length
    }

    const redo = () => {
        if (!_redoStack.length) return
        _undoStack.push(_snapshot())
        _undoCount.value = _undoStack.length
        _restoreItems(_redoStack.pop())
        _redoCount.value = _redoStack.length
    }

    // Pan interaction
    const isPanning = ref(false)
    const panStart = ref({ x: 0, y: 0, tx: 0, ty: 0 })

    const handleContainerMousedown = (e) => {
        if (e.button !== 0) return
        if (e.shiftKey) {
            // Start rubber-band selection
            const container = canvasContainerRef.value
            if (!container) return
            const containerRect = container.getBoundingClientRect()
            selectionRectangle.value = {
                x1: e.clientX - containerRect.left,
                y1: e.clientY - containerRect.top,
                x2: e.clientX - containerRect.left,
                y2: e.clientY - containerRect.top,
            }
        } else {
            clearSelection()
            isPanning.value = true
            panStart.value = {
                x: e.clientX,
                y: e.clientY,
                tx: transform.value.x,
                ty: transform.value.y,
            }
        }
    }

    // Card drag interaction
    // shallowRef so writing currentX/currentY during mousemove doesn't re-trigger Vue
    const dragState = shallowRef(null)

    const handleCardMousedown = (item, e) => {
        if (e.button !== 0) return
        // Suppress drag when the pointer is on an interactive element
        for (const el of e.composedPath()) {
            if (el === e.currentTarget) break
            if (el.nodeType !== 1) continue
            if (INTERACTIVE_TAGS.has(el.tagName?.toLowerCase())) return
            if (el.isContentEditable) return
        }
        e.preventDefault()
        e.stopPropagation()

        if (e.shiftKey) {
            toggleSelection(item.id)
            return
        }

        if (isSelected(item.id)) {
            // Drag all selected cards together
            recordSnapshot()
            const startPositions = new Map()
            for (const id of selectedIds.value) {
                const c = canvasItemsById.value.get(id)
                if (c) {
                    bringToFront(c)
                    startPositions.set(id, { x: c.x, y: c.y })
                }
            }
            multiDragState.value = {
                startMouseX: e.clientX,
                startMouseY: e.clientY,
                startPositions,
            }
        } else {
            recordSnapshot()
            bringToFront(item)
            dragState.value = {
                id: item.id,
                startMouseX: e.clientX,
                startMouseY: e.clientY,
                startItemX: item.x,
                startItemY: item.y,
            }
        }
    }

    // Global mouse handlers (registered on window)
    const handleGlobalMousemove = (e) => {
        if (selectionRectangle.value) {
            const container = canvasContainerRef.value
            if (!container) return
            const containerRect = container.getBoundingClientRect()
            selectionRectangle.value = {
                ...selectionRectangle.value,
                x2: e.clientX - containerRect.left,
                y2: e.clientY - containerRect.top,
            }
            return
        }
        if (isPanning.value) {
            transform.value = {
                ...transform.value,
                x: panStart.value.tx + (e.clientX - panStart.value.x),
                y: panStart.value.ty + (e.clientY - panStart.value.y),
            }
            return
        }
        if (multiDragState.value) {
            const ds = multiDragState.value
            const dx = (e.clientX - ds.startMouseX) / transform.value.scale
            const dy = (e.clientY - ds.startMouseY) / transform.value.scale
            if (!ds.currentPositions) ds.currentPositions = new Map()
            for (const [id, start] of ds.startPositions) {
                const x = snap(start.x + dx)
                const y = snap(start.y + dy)
                ds.currentPositions.set(id, { x, y })
                const el = cardElementRefs.get(id)
                if (el) el.style.transform = `translate(${x}px, ${y}px)`
            }
            return
        }
        if (dragState.value) {
            const ds = dragState.value
            const dx = e.clientX - ds.startMouseX
            const dy = e.clientY - ds.startMouseY
            const newX = snap(ds.startItemX + dx / transform.value.scale)
            const newY = snap(ds.startItemY + dy / transform.value.scale)
            ds.currentX = newX
            ds.currentY = newY
            const el = cardElementRefs.get(ds.id)
            if (el) el.style.transform = `translate(${newX}px, ${newY}px)`
        }
    }

    const handleGlobalMouseup = () => {
        if (selectionRectangle.value) {
            if (pendingSelectionIds.value.size > 0) selectedIds.value = pendingSelectionIds.value
            selectionRectangle.value = null
            return
        }
        // Sync positions from direct DOM manipulation back into Vue reactive state (one render)
        if (dragState.value) {
            const { id, currentX, currentY } = dragState.value
            if (currentX !== undefined) {
                const item = canvasItemsById.value.get(id)
                if (item) { item.x = currentX; item.y = currentY }
            }
            saveState()
            dragState.value = null
        }
        if (multiDragState.value) {
            const ds = multiDragState.value
            if (ds.currentPositions) {
                for (const [id, pos] of ds.currentPositions) {
                    const item = canvasItemsById.value.get(id)
                    if (item) { item.x = pos.x; item.y = pos.y }
                }
                saveState()
            }
            multiDragState.value = null
        }
        isPanning.value = false
    }

    // Zoom
    const handleWheel = (e) => {
        const container = canvasContainerRef.value
        if (!container) return
        const rect = container.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.value.scale * factor))

        // Keep the point under the cursor stationary
        const canvasX = (mouseX - transform.value.x) / transform.value.scale
        const canvasY = (mouseY - transform.value.y) / transform.value.scale

        transform.value = {
            scale: newScale,
            x: mouseX - canvasX * newScale,
            y: mouseY - canvasY * newScale,
        }
        saveState()
    }

    const adjustZoom = (factor) => {
        const container = canvasContainerRef.value
        if (!container) return
        const { width, height } = container.getBoundingClientRect()
        const cx = width / 2
        const cy = height / 2
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.value.scale * factor))
        const canvasX = (cx - transform.value.x) / transform.value.scale
        const canvasY = (cy - transform.value.y) / transform.value.scale
        transform.value = {
            scale: newScale,
            x: cx - canvasX * newScale,
            y: cy - canvasY * newScale,
        }
        saveState()
    }

    const resetView = () => {
        transform.value = { x: 0, y: 0, scale: 1 }
        saveState()
    }

    // Z-index stacking
    const topZIndex = ref(1)

    const bringToFront = (item) => {
        topZIndex.value += 1
        item.zIndex = topZIndex.value
    }

    const isDragging = (id) => {
        if (dragState.value?.id === id) return true
        return !!(multiDragState.value && selectedIds.value.has(id))
    }

    // Item placement & management
    const _placeItem = (type, itemId) => {
        const container = canvasContainerRef.value
        if (!container) return
        const { width, height } = container.getBoundingClientRect()
        const cx = (width / 2 - transform.value.x) / transform.value.scale
        const cy = (height / 2 - transform.value.y) / transform.value.scale
        const stagger = (canvasItems.value.length % 10) * 24
        topZIndex.value += 1
        canvasItems.value.push({
            id: crypto.randomUUID(),
            type,
            itemId,
            x: snap(cx - 150 + stagger),
            y: snap(cy - 80 + stagger),
            zIndex: topZIndex.value,
        })
    }

    const addItem = (type, itemId) => {
        recordSnapshot()
        _placeItem(type, itemId)
        saveState()
    }

    const addAllItems = (type, items) => {
        if (!items.length) return
        recordSnapshot()
        items.forEach(item => _placeItem(type, item.id))
        saveState()
    }

    const removeItem = (id) => {
        recordSnapshot()
        canvasItems.value = canvasItems.value.filter(i => i.id !== id)
        const next = new Set(selectedIds.value)
        if (next.delete(id)) selectedIds.value = next
        saveState()
    }

    // Removes all canvas cards whose backing data item was deleted
    const removeItemsBySource = (type, itemId) => {
        const removed = canvasItems.value
            .filter(i => i.type === type && i.itemId === itemId)
            .map(i => i.id)
        if (!removed.length) return
        recordSnapshot()
        canvasItems.value = canvasItems.value.filter(i => !(i.type === type && i.itemId === itemId))
        const next = new Set(selectedIds.value)
        removed.forEach(id => next.delete(id))
        selectedIds.value = next
        saveState()
    }

    const clearAll = () => {
        if (!window.confirm('Remove all cards from the tabletop?')) return
        recordSnapshot()
        canvasItems.value = []
        selectedIds.value = new Set()
        saveState()
    }

    // Persistence
    const saveState = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                items: canvasItems.value,
                transform: transform.value,
            }))
        } catch {
            // Storage full or unavailable – silently skip
        }
    }

    const loadState = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) return
            const state = JSON.parse(raw)
            if (Array.isArray(state.items)) {
                // Back-fill zIndex for items persisted before this field existed
                state.items.forEach((item, i) => {
                    if (item.zIndex == null) item.zIndex = i + 1
                })
                canvasItems.value = state.items
                topZIndex.value = Math.max(1, ...state.items.map(i => i.zIndex ?? 0))
            }
            if (state.transform) transform.value = state.transform
        } catch {
            // Corrupted state – start fresh
        }
    }

    // Keyboard handlers
    const handleGlobalKeydown = (e) => {
        // Don't steal keystrokes from inputs, textareas, or contenteditable elements
        const tag = document.activeElement?.tagName?.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) return

        const ctrlOrCmd = e.metaKey || e.ctrlKey

        if (ctrlOrCmd && e.key === 'z') {
            e.preventDefault()
            if (e.shiftKey) redo()
            else undo()
            return
        }

        if (ctrlOrCmd && e.key === 'y') {
            e.preventDefault()
            redo()
            return
        }

        if (e.key !== 'Delete' && e.key !== 'Backspace') return
        if (selectedIds.value.size === 0) return
        e.preventDefault()
        recordSnapshot()
        const toRemove = [...selectedIds.value]
        canvasItems.value = canvasItems.value.filter(i => !toRemove.includes(i.id))
        selectedIds.value = new Set()
        saveState()
    }

    // Lifecycle
    onMounted(() => {
        loadState()
        window.addEventListener('mousemove', handleGlobalMousemove)
        window.addEventListener('mouseup', handleGlobalMouseup)
        window.addEventListener('keydown', handleGlobalKeydown)
    })

    onUnmounted(() => {
        window.removeEventListener('mousemove', handleGlobalMousemove)
        window.removeEventListener('mouseup', handleGlobalMouseup)
        window.removeEventListener('keydown', handleGlobalKeydown)
    })

    return {
        canvasContainerRef,
        canvasItems,
        resolvedItemMap,
        transform,
        snapToGrid,
        gridSize,
        canvasTransformStyle,
        canvasGridStyle,
        canUndo,
        canRedo,
        undo,
        redo,
        selectedIds,
        selectionRectangle,
        isSelected,
        isPendingSelection,
        isDragging,
        registerCardRef,
        getImprovementsVisible,
        setImprovementsVisible,
        getSuccessesVisible,
        setSuccessesVisible,
        handleWheel,
        handleContainerMousedown,
        handleCardMousedown,
        adjustZoom,
        resetView,
        toggleSnap,
        increaseGridSize,
        decreaseGridSize,
        addItem,
        addAllItems,
        removeItem,
        removeItemsBySource,
        clearAll,
    }
}
