import { ref, shallowRef, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTabletopDragState } from './useTabletopDragState'
import { useCampaignStore } from '@/stores/campaignStore'

const MIN_SCALE = 0.1
const MAX_SCALE = 4
const MAX_HISTORY = 50
// Tags whose presence in the event path should suppress token dragging
const INTERACTIVE_TAGS = new Set(['button', 'a', 'input', 'select', 'textarea', 'label'])

export function useTabletopCanvas(campaignId, tabletopId) {
    const { draggingCharacter, clearDraggingCharacter } = useTabletopDragState()
    const campaignStore = useCampaignStore()

    // Debounce timer for persisting canvas state to the backend
    let _saveTimer = null

    // ─── Canvas items (tokens) ───────────────────────────────────────────────
    const canvasItems = ref([])

    // O(1) lookup used by drag hot-path
    const canvasItemsById = computed(() => {
        const map = new Map()
        for (const item of canvasItems.value) map.set(item.id, item)
        return map
    })

    // ─── Transform (pan/zoom) ────────────────────────────────────────────────
    const transform = ref({ x: 0, y: 0, scale: 1 })

    const canvasTransformStyle = computed(() => ({
        transform: `translate(${transform.value.x}px, ${transform.value.y}px) scale(${transform.value.scale})`,
    }))

    // ─── Grid (always active, no toggle) ─────────────────────────────────────
    const gridSize = ref(40)
    const gridColor = ref('#ffffff')
    const gridOpacity = ref(0.06)

    const snap = (val) => Math.round(val / gridSize.value) * gridSize.value
    // Snap to the centre of the nearest grid cell (used for measurement origin/waypoints)
    const snapCenter = (val) => Math.floor(val / gridSize.value) * gridSize.value + gridSize.value / 2

    // Grid overlay is a sibling of the canvas div in the container, so its
    // background-position must track the canvas transform to stay aligned.
    const canvasGridStyle = computed(() => {
        const size = gridSize.value * transform.value.scale
        const ox = transform.value.x % size
        const oy = transform.value.y % size
        const hex = gridColor.value.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        const lineColor = `rgba(${r}, ${g}, ${b}, ${gridOpacity.value})`
        return {
            backgroundSize: `${size}px ${size}px`,
            backgroundPosition: `${ox}px ${oy}px`,
            backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
        }
    })

    // Re-snap all tokens to the nearest grid line after the grid size changes so
    // they don't drift between squares.
    const _resnapTokens = () => {
        for (const item of canvasItems.value) {
            item.x = snap(item.x)
            item.y = snap(item.y)
            const el = _tokenElementRefs.get(item.id)
            if (el) el.style.transform = `translate(${item.x}px, ${item.y}px)`
        }
    }

    const increaseGridSize = () => { gridSize.value = Math.min(200, gridSize.value + 10); _resnapTokens(); saveState() }
    const decreaseGridSize = () => { gridSize.value = Math.max(10, gridSize.value - 10); _resnapTokens(); saveState() }
    const setGridColor = (color) => { gridColor.value = color; saveState() }
    const setGridOpacity = (opacity) => { gridOpacity.value = opacity; saveState() }

    // ─── Background image (defines canvas bounds) ────────────────────────────
    // { url, naturalWidth, naturalHeight } or null for an unbounded canvas
    const backgroundImage = ref(null)

    // When a background image is set, the canvas div gets a fixed size so that
    // tokens are bounded to the map area.
    const canvasSizeStyle = computed(() => {
        if (!backgroundImage.value) return {}
        return {
            width: `${backgroundImage.value.naturalWidth}px`,
            height: `${backgroundImage.value.naturalHeight}px`,
        }
    })

    const setBackgroundImage = (url) => {
        if (!url) { clearBackgroundImage(); return }
        const img = new Image()
        img.onload = () => {
            backgroundImage.value = { url, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight }
            saveState()
            resetView()
        }
        img.onerror = () => console.warn('[VTT] Failed to load background image:', url)
        img.src = url
    }

    const clearBackgroundImage = () => {
        backgroundImage.value = null
        saveState()
    }

    // ─── Undo / Redo ─────────────────────────────────────────────────────────
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
        selectedIds.value = new Set()
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

    // ─── DOM refs ────────────────────────────────────────────────────────────
    const canvasContainerRef = ref(null)

    // Dynamic refs to token DOM elements, keyed by canvas-item id.
    // Used to move tokens directly via style.transform during drag without
    // triggering Vue reactivity on every mousemove.
    const _tokenElementRefs = new Map()
    const registerTokenRef = (id, el) => {
        if (el) _tokenElementRefs.set(id, el)
        else _tokenElementRefs.delete(id)
    }

    // ─── Selection (multi-token) ─────────────────────────────────────────────────
    const selectedIds = ref(new Set())
    const isSelected = (id) => selectedIds.value.has(id) || _liveSelectionIds.value.has(id)
    const clearSelection = () => { selectedIds.value = new Set() }
    const toggleSelected = (id) => {
        const next = new Set(selectedIds.value)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        selectedIds.value = next
    }

    // ─── Z-index stacking ────────────────────────────────────────────────────
    const topZIndex = ref(1)

    const bringToFront = (item) => {
        topZIndex.value += 1
        item.zIndex = topZIndex.value
    }

    // ─── Ghost overlay ────────────────────────────────────────────────────────
    // tokenGhosts: array of ghost objects shown while dragging tokens on the canvas
    const tokenGhosts = ref([])
    // dropGhost: shown while dragging a character from PinnedTokensContainer over the canvas
    const dropGhost = ref(null)
    // All active ghosts: dragged token ghosts plus the optional drop ghost
    const activeGhosts = computed(() => {
        const ghosts = [...tokenGhosts.value]
        if (dropGhost.value) ghosts.push(dropGhost.value)
        return ghosts
    })

    // ─── Measurement / path display ───────────────────────────────────────────
    const showPaths = ref(true)
    const setShowPaths = (val) => { showPaths.value = val; saveState() }

    // ─── Measurement tracks (one per dragged token) ───────────────────────────
    // Each track: { waypoints: [{x,y}], currentPoint: {x,y} | null, size: Number }
    const isMeasuring = ref(false)
    const measureTracks = ref([])  // used during token drag (one track per token)
    // Single-path measurement (canvas shift-click mode)
    const measureWaypoints = ref([])
    const measureCurrent = ref(null)
    const isCmdHeld = ref(false)

    // ─── Rubber-band selection ────────────────────────────────────────────────
    const isSelecting = ref(false)
    const selectionRectCanvas = ref(null) // { x1, y1, x2, y2 } in canvas coords
    const _liveSelectionIds = ref(new Set()) // ids highlighted during rubber-band drag
    let _selectStart = null

    // ─── Right-click pan ─────────────────────────────────────────────────────
    const isPanning = ref(false)
    const _panStart = { x: 0, y: 0, tx: 0, ty: 0 }
    // Tracks whether the current canvas shift-click measurement started as a drag
    let _canvasMeasureDragging = false

    const handleContainerMousedown = (e) => {
        if (e.button === 2) {
            // Right-click: start pan, cancel any active canvas measurement
            isPanning.value = true
            _panStart.x = e.clientX
            _panStart.y = e.clientY
            _panStart.tx = transform.value.x
            _panStart.ty = transform.value.y
            if (isMeasuring.value && !dragState.value) {
                isMeasuring.value = false
                measureWaypoints.value = []
                measureCurrent.value = null
            }
        } else if (e.button === 0) {
            if (e.shiftKey) {
                // Shift+left-click on empty canvas: start or extend canvas measurement
                const pos = _containerPos(e)
                if (!pos) return
                const cx = snapCenter(pos.canvasX)
                const cy = snapCenter(pos.canvasY)
                if (isMeasuring.value && !dragState.value) {
                    // Lock current position as a waypoint and continue from the clicked point
                    measureWaypoints.value = [...measureWaypoints.value, { x: cx, y: cy }]
                    _canvasMeasureDragging = false
                } else {
                    isMeasuring.value = true
                    measureWaypoints.value = [{ x: cx, y: cy }]
                    measureCurrent.value = { x: cx, y: cy }
                    _canvasMeasureDragging = true
                }
            } else {
                // Plain left-click on empty canvas: end canvas measurement, deselect, begin rubber-band
                if (isMeasuring.value && !dragState.value) {
                    isMeasuring.value = false
                    measureWaypoints.value = []
                    measureCurrent.value = null
                }
                clearSelection()
                const pos = _containerPos(e)
                if (pos) {
                    isSelecting.value = true
                    _selectStart = pos
                    selectionRectCanvas.value = { x1: pos.canvasX, y1: pos.canvasY, x2: pos.canvasX, y2: pos.canvasY }
                }
            }
        }
    }

    // ─── Left-click token drag (multi-token) ──────────────────────────────────────────
    // shallowRef: mutations to ds.currentRawDx etc. don't trigger Vue reactivity
    const dragState = shallowRef(null)

    const isDragging = (id) => {
        const ds = dragState.value
        return ds ? ds.items.some(i => i.id === id) : false
    }

    const handleTokenMousedown = (item, e) => {
        if (e.button !== 0) return
        // Don't start drag when clicking interactive elements inside the token
        for (const el of e.composedPath()) {
            if (el === e.currentTarget) break
            if (el.nodeType !== 1) continue
            if (INTERACTIVE_TAGS.has(el.tagName?.toLowerCase())) return
            if (el.isContentEditable) return
        }
        e.preventDefault()
        e.stopPropagation()

        if (e.shiftKey) {
            // Shift+click: toggle selection without starting a drag
            toggleSelected(item.id)
            return
        }

        // Determine which tokens to drag: if clicked token is already selected, drag all selected;
        // otherwise clear selection and drag only this token.
        const idsToMove = isSelected(item.id) ? [...selectedIds.value] : [item.id]
        selectedIds.value = new Set(idsToMove)

        // Bring all dragging tokens to front; primary token gets the highest z-index.
        for (const id of idsToMove) {
            if (id === item.id) continue
            const i = canvasItemsById.value.get(id)
            if (i) bringToFront(i)
        }
        bringToFront(item)

        const itemsToDrag = idsToMove.map(id => {
            const i = canvasItemsById.value.get(id)
            return { id, startX: i.x, startY: i.y }
        })

        dragState.value = {
            primaryId: item.id,
            items: itemsToDrag,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            snapshotRecorded: false,
            currentRawDx: 0,
            currentRawDy: 0,
        }

        // Start measurement tracks for all dragged tokens
        isMeasuring.value = true
        measureTracks.value = itemsToDrag.map(({ id, startX, startY }) => {
            const i = canvasItemsById.value.get(id)
            const halfPx = (i.size * gridSize.value) / 2
            const origin = { x: startX + halfPx, y: startY + halfPx }
            return { waypoints: [origin], currentPoint: { ...origin }, size: i.size }
        })
        // Clear canvas shift-click measurement path when starting a drag
        measureWaypoints.value = []
        measureCurrent.value = null
    }

    // ─── HTML5 drag-from-rail drop zone ──────────────────────────────────────
    const _containerPos = (e) => {
        const container = canvasContainerRef.value
        if (!container) return null
        const rect = container.getBoundingClientRect()
        return {
            canvasX: (e.clientX - rect.left - transform.value.x) / transform.value.scale,
            canvasY: (e.clientY - rect.top - transform.value.y) / transform.value.scale,
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        const dc = draggingCharacter.value
        if (!dc) return
        const pos = _containerPos(e)
        if (!pos) return
        const halfPx = ((dc.size || 1) * gridSize.value) / 2
        dropGhost.value = {
            ...dc,
            x: snap(pos.canvasX - halfPx),
            y: snap(pos.canvasY - halfPx),
        }
    }

    const handleDragLeave = (e) => {
        // Only clear ghost when the pointer leaves the canvas container entirely
        if (!canvasContainerRef.value?.contains(e.relatedTarget)) {
            dropGhost.value = null
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        const raw = e.dataTransfer.getData('application/vtt-character')
        if (!raw) return
        let snapshot
        try { snapshot = JSON.parse(raw) } catch { return }
        const pos = _containerPos(e)
        if (!pos) return
        const halfPx = ((snapshot.size || 1) * gridSize.value) / 2
        const x = snap(pos.canvasX - halfPx)
        const y = snap(pos.canvasY - halfPx)
        recordSnapshot()
        // Remove any existing token for the same character so there's only one instance
        if (snapshot.characterId) {
            canvasItems.value = canvasItems.value.filter(i => i.characterId !== snapshot.characterId)
        }
        _placeToken(snapshot, x, y)
        dropGhost.value = null
        clearDraggingCharacter()
        saveState()
    }

    // ─── Global mouse handlers ────────────────────────────────────────────────
    const handleGlobalMousemove = (e) => {
        isCmdHeld.value = e.metaKey || e.ctrlKey

        if (isPanning.value) {
            transform.value = {
                ...transform.value,
                x: _panStart.tx + (e.clientX - _panStart.x),
                y: _panStart.ty + (e.clientY - _panStart.y),
            }
            return
        }

        if (isSelecting.value) {
            const pos = _containerPos(e)
            if (pos) {
                selectionRectCanvas.value = {
                    x1: _selectStart.canvasX,
                    y1: _selectStart.canvasY,
                    x2: pos.canvasX,
                    y2: pos.canvasY,
                }
                // Live preview: compute which tokens fall inside the current rect
                const rect = selectionRectCanvas.value
                const minX = Math.min(rect.x1, rect.x2)
                const maxX = Math.max(rect.x1, rect.x2)
                const minY = Math.min(rect.y1, rect.y2)
                const maxY = Math.max(rect.y1, rect.y2)
                if (maxX - minX > 4 || maxY - minY > 4) {
                    const next = new Set()
                    for (const item of canvasItems.value) {
                        const sz = item.size * gridSize.value
                        if (item.x + sz > minX && item.x < maxX && item.y + sz > minY && item.y < maxY) {
                            next.add(item.id)
                        }
                    }
                    _liveSelectionIds.value = next
                } else {
                    _liveSelectionIds.value = new Set()
                }
            }
            return
        }

        if (dragState.value) {
            const ds = dragState.value
            const dx = (e.clientX - ds.startMouseX) / transform.value.scale
            const dy = (e.clientY - ds.startMouseY) / transform.value.scale

            // Record snapshot on first actual movement so click-only actions don't pollute history
            if (!ds.snapshotRecorded && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
                recordSnapshot()
                ds.snapshotRecorded = true
            }

            ds.currentRawDx = dx
            ds.currentRawDy = dy

            // Move all dragging token DOM elements freely (no snap) to avoid a Vue re-render per frame
            for (const { id, startX, startY } of ds.items) {
                const el = _tokenElementRefs.get(id)
                if (el) el.style.transform = `translate(${startX + dx}px, ${startY + dy}px)`
            }

            // Update ghosts and measurement tracks for all dragged tokens
            const newGhosts = []
            const newTracks = measureTracks.value.map((track) => ({ ...track }))
            for (let idx = 0; idx < ds.items.length; idx++) {
                const { id, startX, startY } = ds.items[idx]
                const dragItem = canvasItemsById.value.get(id)
                if (!dragItem) continue
                const snappedX = snap(startX + dx)
                const snappedY = snap(startY + dy)
                newGhosts.push({
                    x: snappedX,
                    y: snappedY,
                    size: dragItem.size,
                    name: dragItem.name,
                    portraitUrl: dragItem.portraitUrl,
                    isBeast: dragItem.isBeast,
                })
                if (isMeasuring.value && newTracks[idx]) {
                    const halfPx = (dragItem.size * gridSize.value) / 2
                    newTracks[idx] = {
                        ...newTracks[idx],
                        currentPoint: { x: snappedX + halfPx, y: snappedY + halfPx },
                    }
                }
            }
            tokenGhosts.value = newGhosts
            if (isMeasuring.value) measureTracks.value = newTracks
            return
        }

        // Update canvas measurement current point (no token drag active)
        if (isMeasuring.value) {
            const pos = _containerPos(e)
            if (pos) {
                measureCurrent.value = { x: snapCenter(pos.canvasX), y: snapCenter(pos.canvasY) }
            }
        }
    }

    const handleGlobalMouseup = () => {
        if (isPanning.value) {
            isPanning.value = false
            saveState()
            return
        }

        if (isSelecting.value) {
            // Finalise rubber-band: select all tokens whose bounding box overlaps the rect
            const rect = selectionRectCanvas.value
            if (rect) {
                const minX = Math.min(rect.x1, rect.x2)
                const maxX = Math.max(rect.x1, rect.x2)
                const minY = Math.min(rect.y1, rect.y2)
                const maxY = Math.max(rect.y1, rect.y2)
                // Only treat as a selection drag if the rect has some meaningful size
                if (maxX - minX > 4 || maxY - minY > 4) {
                    const next = new Set()
                    for (const item of canvasItems.value) {
                        const sz = item.size * gridSize.value
                        if (item.x + sz > minX && item.x < maxX && item.y + sz > minY && item.y < maxY) {
                            next.add(item.id)
                        }
                    }
                    selectedIds.value = next
                }
            }
            isSelecting.value = false
            selectionRectCanvas.value = null
            _selectStart = null
            _liveSelectionIds.value = new Set()
            return
        }

        if (dragState.value) {
            const ds = dragState.value
            if (ds.snapshotRecorded) {
                // Snap all dragged tokens to the nearest grid line
                for (const { id, startX, startY } of ds.items) {
                    const snappedX = snap(startX + ds.currentRawDx)
                    const snappedY = snap(startY + ds.currentRawDy)
                    const item = canvasItemsById.value.get(id)
                    if (item) {
                        item.x = snappedX
                        item.y = snappedY
                        const el = _tokenElementRefs.get(id)
                        if (el) el.style.transform = `translate(${snappedX}px, ${snappedY}px)`
                    }
                }
                saveState()
            }
            tokenGhosts.value = []
            dragState.value = null
            // End token measurement
            isMeasuring.value = false
            measureTracks.value = []
            measureWaypoints.value = []
            measureCurrent.value = null
            return
        }

        // Stop canvas shift-drag measurement when the mouse is released after dragging
        if (_canvasMeasureDragging && isMeasuring.value && !dragState.value) {
            _canvasMeasureDragging = false
            isMeasuring.value = false
            measureWaypoints.value = []
            measureCurrent.value = null
        }
    }

    // ─── Zoom ─────────────────────────────────────────────────────────────────
    const handleWheel = (e) => {
        const container = canvasContainerRef.value
        if (!container) return
        const rect = container.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.value.scale * factor))
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
        const container = canvasContainerRef.value
        if (backgroundImage.value && container) {
            const { width: cw, height: ch } = container.getBoundingClientRect()
            const { naturalWidth: iw, naturalHeight: ih } = backgroundImage.value
            const scale = Math.min(cw / iw, ch / ih, 1)
            transform.value = {
                scale,
                x: (cw - iw * scale) / 2,
                y: (ch - ih * scale) / 2,
            }
        } else {
            transform.value = { x: 0, y: 0, scale: 1 }
        }
        saveState()
    }

    // ─── Token placement ──────────────────────────────────────────────────────
    const _placeToken = (snapshot, x, y) => {
        topZIndex.value += 1
        canvasItems.value.push({
            id: crypto.randomUUID(),
            characterId: snapshot.characterId,
            isBeast: snapshot.isBeast ?? false,
            name: snapshot.name ?? 'Unknown',
            portraitUrl: snapshot.portraitUrl ?? null,
            size: snapshot.size || 1,
            x,
            y,
            zIndex: topZIndex.value,
        })
    }

    const removeToken = (id) => {
        recordSnapshot()
        canvasItems.value = canvasItems.value.filter(i => i.id !== id)
        const next = new Set(selectedIds.value)
        next.delete(id)
        selectedIds.value = next
        saveState()
    }

    const clearAll = () => {
        if (!window.confirm('Remove all tokens from the tabletop?')) return
        recordSnapshot()
        canvasItems.value = []
        selectedIds.value = new Set()
        saveState()
    }

    // ─── Keyboard ─────────────────────────────────────────────────────────────
    const handleGlobalKeydown = (e) => {
        const tag = document.activeElement?.tagName?.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) return

        // Track cmd/ctrl for measurement exact-mode even without a mousemove
        if (e.key === 'Meta' || e.key === 'Control') isCmdHeld.value = true

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

        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.value.size > 0) {
            e.preventDefault()
            recordSnapshot()
            const toDelete = new Set(selectedIds.value)
            canvasItems.value = canvasItems.value.filter(i => !toDelete.has(i.id))
            selectedIds.value = new Set()
            saveState()
            return
        }

        if (e.key === ' ' && isMeasuring.value) {
            e.preventDefault()
            if (dragState.value) {
                // Lock current snapped position as a waypoint for each token track
                measureTracks.value = measureTracks.value.map(track => {
                    if (!track.currentPoint) return track
                    return {
                        ...track,
                        waypoints: [...track.waypoints, { ...track.currentPoint }],
                    }
                })
            } else if (measureCurrent.value) {
                // Insert a waypoint at the current canvas measurement position
                measureWaypoints.value = [...measureWaypoints.value, { ...measureCurrent.value }]
            }
            return
        }

        if (e.key === 'Escape' && isMeasuring.value && !dragState.value) {
            e.preventDefault()
            isMeasuring.value = false
            measureWaypoints.value = []
            measureCurrent.value = null
        }
    }

    const handleGlobalKeyup = (e) => {
        if (e.key === 'Meta' || e.key === 'Control') isCmdHeld.value = false
    }

    // ─── Persistence ─────────────────────────────────────────────────────────
    const saveState = () => {
        const cid = typeof campaignId === 'object' ? campaignId.value : campaignId
        const tid = typeof tabletopId === 'object' ? tabletopId.value : tabletopId
        if (!cid || !tid) return
        if (_saveTimer) clearTimeout(_saveTimer)
        _saveTimer = setTimeout(() => {
            campaignStore.updateTabletop(cid, tid, {
                items: canvasItems.value,
                transform: transform.value,
                backgroundImage: backgroundImage.value,
                gridSize: gridSize.value,
                gridColor: gridColor.value,
                gridOpacity: gridOpacity.value,
                showPaths: showPaths.value,
            }).catch((err) => console.warn('[VTT] Failed to persist tabletop state:', err))
        }, 500)
    }

    const loadState = () => {
        const tid = typeof tabletopId === 'object' ? tabletopId.value : tabletopId
        const tabletop = campaignStore.tabletops.find((t) => t.id === tid)
        if (!tabletop) return
        if (Array.isArray(tabletop.items)) {
            tabletop.items.forEach((item, i) => {
                if (item.zIndex == null) item.zIndex = i + 1
            })
            canvasItems.value = tabletop.items
            topZIndex.value = Math.max(1, ...tabletop.items.map((i) => i.zIndex ?? 0))
        }
        if (tabletop.transform) transform.value = tabletop.transform
        if (tabletop.backgroundImage) backgroundImage.value = tabletop.backgroundImage
        if (tabletop.gridSize) gridSize.value = tabletop.gridSize
        if (tabletop.gridColor) gridColor.value = tabletop.gridColor
        if (tabletop.gridOpacity != null) gridOpacity.value = tabletop.gridOpacity
        if (tabletop.showPaths != null) showPaths.value = tabletop.showPaths
    }

    // ─── Tabletop switch (route param changes without component re-mount) ───────
    // When tabletopId changes (Vue Router reuses this component), cancel any
    // pending save (to avoid writing stale data to the new tabletop), reset all
    // canvas state, and load the incoming tabletop's persisted state.
    watch(
        () => (typeof tabletopId === 'object' ? tabletopId.value : tabletopId),
        (newId, oldId) => {
            if (!newId || newId === oldId) return
            if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null }
            canvasItems.value = []
            transform.value = { x: 0, y: 0, scale: 1 }
            backgroundImage.value = null
            gridSize.value = 40
            gridColor.value = '#ffffff'
            gridOpacity.value = 0.06
            showPaths.value = true
            _undoStack.length = 0
            _redoStack.length = 0
            _undoCount.value = 0
            _redoCount.value = 0
            selectedIds.value = new Set()
            topZIndex.value = 1
            loadState()
        }
    )

    // ─── Lifecycle ────────────────────────────────────────────────────────────
    onMounted(() => {
        window.addEventListener('mousemove', handleGlobalMousemove)
        window.addEventListener('mouseup', handleGlobalMouseup)
        window.addEventListener('keydown', handleGlobalKeydown)
        window.addEventListener('keyup', handleGlobalKeyup)
    })

    onUnmounted(() => {
        if (_saveTimer) clearTimeout(_saveTimer)
        window.removeEventListener('mousemove', handleGlobalMousemove)
        window.removeEventListener('mouseup', handleGlobalMouseup)
        window.removeEventListener('keydown', handleGlobalKeydown)
        window.removeEventListener('keyup', handleGlobalKeyup)
    })

    return {
        canvasContainerRef,
        canvasItems,
        transform,
        backgroundImage,
        gridSize,
        gridColor,
        gridOpacity,
        canvasTransformStyle,
        canvasGridStyle,
        canvasSizeStyle,
        activeGhosts,
        canUndo,
        canRedo,
        undo,
        redo,
        selectedIds,
        isSelected,
        isDragging,
        isPanning,
        isSelecting,
        selectionRectCanvas,
        isMeasuring,
        measureTracks,
        measureWaypoints,
        measureCurrent,
        isCmdHeld,
        registerTokenRef,
        handleWheel,
        handleContainerMousedown,
        handleTokenMousedown,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        adjustZoom,
        increaseGridSize,
        decreaseGridSize,
        setBackgroundImage,
        clearBackgroundImage,
        setGridColor,
        setGridOpacity,
        showPaths,
        setShowPaths,
        removeToken,
        clearAll,
        loadState,
    }
}
