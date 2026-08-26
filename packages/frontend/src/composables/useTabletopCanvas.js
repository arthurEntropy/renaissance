import { ref, shallowRef, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTabletopDragState } from './useTabletopDragState'
import { useTabletopSelectionState } from './useTabletopSelectionState'
import { useCampaignStore } from '@/stores/campaignStore'
import { useConfirm } from './useConfirm'

const MIN_SCALE = 0.1
const MAX_SCALE = 4
const MAX_HISTORY = 50
// Tags whose presence in the event path should suppress token dragging
const INTERACTIVE_TAGS = new Set(['button', 'a', 'input', 'select', 'textarea', 'label'])

export function useTabletopCanvas(campaignId, tabletopId, { onStateSaved, isWorldMap = false } = {}) {
    const { draggingCharacter, clearDraggingCharacter, draggingGroup, clearDraggingGroup, draggingCulture, clearDraggingCulture } = useTabletopDragState()
    const { setSelectedCharacterIds, clearSelectedCharacterIds } = useTabletopSelectionState()
    const campaignStore = useCampaignStore()

    // Debounce timer for persisting canvas state to the backend
    let _saveTimer = null
    // True only after loadState() has successfully populated canvas from the store.
    // Prevents saveState() from overwriting real server data with the reset/default
    // state that exists before the tabletop has been loaded (the primary cause of
    // data corruption reported by users).
    let _stateReady = false
    // True while applyExternalState() is running so saveState() does not echo back.
    let _applyingExternalState = false

    // ─── Roll log (persisted) ────────────────────────────────────────────────
    // This ref is owned here so it can be included in the persistence snapshot.
    // All logic that populates it lives in useTabletopRollLog.
    const rollLog = ref([])
    // Per-user, per-tabletop expanded state for the roll log panel.
    // Saved to REST (not broadcast via socket) so each user has their own preference.
    const rollLogExpanded = ref(false)
    const setRollLogExpanded = (val) => {
        rollLogExpanded.value = val
        saveState()
    }

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

    // On the world map there is no grid – positions are free-form canvas pixels.
    const snap = (val) => isWorldMap ? val : Math.round(val / gridSize.value) * gridSize.value
    // Snap to the centre of the nearest grid cell (used for measurement origin/waypoints)
    const snapCenter = (val) => isWorldMap ? val : Math.floor(val / gridSize.value) * gridSize.value + gridSize.value / 2

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

    // ─── Map scale (scales the background image and canvas bounds) ───────────
    const mapScale = ref(1)
    const increaseMapScale = () => { mapScale.value = Math.min(10, parseFloat((mapScale.value + 0.1).toFixed(2))); saveState() }
    const decreaseMapScale = () => { mapScale.value = Math.max(0.1, parseFloat((mapScale.value - 0.1).toFixed(2))); saveState() }

    // ─── World map specific ───────────────────────────────────────────────────
    const pixelsPerMile = ref(40)
    const characterTokenSize = ref(40)
    const cultureTokenSize = ref(60)
    const cultureTokensLocked = ref(false)

    const increasePixelsPerMile = () => { pixelsPerMile.value = Math.min(500, pixelsPerMile.value + 1); saveState() }
    const decreasePixelsPerMile = () => { pixelsPerMile.value = Math.max(1, pixelsPerMile.value - 1); saveState() }
    const setCharacterTokenSize = (size) => { characterTokenSize.value = size }
    const setCultureTokenSize = (size) => { cultureTokenSize.value = size }
    const setCultureTokensLocked = (locked) => { cultureTokensLocked.value = locked; saveState() }

    const removeCultureToken = (cultureId) => {
        canvasItems.value = canvasItems.value.filter(
            i => !(i.tokenType === 'culture' && i.cultureId === cultureId)
        )
        saveState()
    }

    // ─── Background image (defines canvas bounds) ────────────────────────────
    // { url, naturalWidth, naturalHeight } or null for an unbounded canvas
    const backgroundImage = ref(null)

    // When a background image is set, the canvas div gets a fixed size so that
    // tokens are bounded to the map area.
    const canvasSizeStyle = computed(() => {
        if (!backgroundImage.value) return {}
        return {
            width: `${backgroundImage.value.naturalWidth * mapScale.value}px`,
            height: `${backgroundImage.value.naturalHeight * mapScale.value}px`,
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

    // Sync committed selection to shared singleton so PinnedTokensContainer can
    // highlight the corresponding tokens in the badge rail.
    watch(selectedIds, (ids) => {
        const charIds = new Set()
        for (const item of canvasItems.value) {
            if (ids.has(item.id) && item.characterId) charIds.add(item.characterId)
        }
        setSelectedCharacterIds(charIds)
    }, { deep: true })

    // ─── Z-index stacking ────────────────────────────────────────────────────
    const topZIndex = ref(1)

    const bringToFront = (item) => {
        topZIndex.value += 1
        item.zIndex = topZIndex.value
    }

    // ─── Ghost overlay ────────────────────────────────────────────────────────
    // tokenGhosts: array of ghost objects shown while dragging tokens on the canvas
    const tokenGhosts = ref([])
    // dropGhost: shown while dragging a single character from PinnedTokensContainer over the canvas
    const dropGhost = ref(null)
    // dropGhosts: shown while dragging a group from PinnedTokensContainer over the canvas
    const dropGhosts = ref([])
    // All active ghosts: dragged token ghosts plus the optional drop ghost(s)
    const activeGhosts = computed(() => {
        const ghosts = [...tokenGhosts.value]
        if (dropGhost.value) ghosts.push(dropGhost.value)
        ghosts.push(...dropGhosts.value)
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
    const isShiftHeld = ref(false)
    const isAltHeld = ref(false)

    // ─── Radius measurement ───────────────────────────────────────────────────
    // { x, y } canvas-space origin (center of square or token)
    const isRadiusMeasuring = ref(false)
    const radiusOrigin = ref(null)
    // Raw cursor position in canvas-space (snapping is handled in the overlay component)
    const radiusCurrent = ref(null)    // Token id this radius measurement originated from (null for canvas-origin)
    let _radiusSourceTokenId = null

    // ─── Persistent radius areas ──────────────────────────────────────────────
    // Each area: { id, originX, originY, radiusFeet, color, tokenId? }
    const radiusAreas = ref([])
    const selectedRadiusAreaId = ref(null)
    // id of the radius area currently being re-adjusted (resize drag)
    const editingRadiusAreaId = ref(null)
    // id of the area the cursor is currently inside (computed from mousemove)
    const hoveringRadiusAreaId = ref(null)
    // Canvas-space cursor position; passed to overlay for edge-cursor direction
    const hoveredCanvasPos = ref(null)
    // True while the user is dragging an edge to resize an existing area
    let _isResizeDrag = false
    // { areaId, originX, originY, startMouseX, startMouseY } while dragging an anchor circle
    let _areaMoveState = null
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
            // Right-click during radius measurement: persist the area
            if (isRadiusMeasuring.value && radiusOrigin.value && radiusCurrent.value) {
                _commitRadiusArea()
                return
            }
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
            if (isRadiusMeasuring.value) {
                isRadiusMeasuring.value = false
                radiusOrigin.value = null
                radiusCurrent.value = null
                _radiusSourceTokenId = null
            }
        } else if (e.button === 0) {
            if (e.shiftKey && (e.metaKey || e.ctrlKey)) {
                // Shift+Cmd/Ctrl: start radius measurement at this canvas position
                const pos = _containerPos(e)
                if (!pos) return
                const cx = snapCenter(pos.canvasX)
                const cy = snapCenter(pos.canvasY)
                isMeasuring.value = false
                measureWaypoints.value = []
                measureCurrent.value = null
                isRadiusMeasuring.value = true
                radiusOrigin.value = { x: cx, y: cy }
                radiusCurrent.value = { x: cx, y: cy }
            } else if (e.shiftKey) {
                // Shift+left-click on empty canvas: start or extend canvas linear measurement
                if (isRadiusMeasuring.value) {
                    isRadiusMeasuring.value = false
                    radiusOrigin.value = null
                    radiusCurrent.value = null
                }
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
                if (isRadiusMeasuring.value) {
                    isRadiusMeasuring.value = false
                    radiusOrigin.value = null
                    radiusCurrent.value = null
                    _radiusSourceTokenId = null
                }
                selectedRadiusAreaId.value = null
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
        // Locked culture tokens: don't drag; let the @click handler process the interaction.
        // Propagation is stopped so the container's rubber-band selection doesn't activate.
        if (item.tokenType === 'culture' && cultureTokensLocked.value) {
            e.stopPropagation()
            return
        }
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
            if (e.metaKey || e.ctrlKey) {
                // Shift+Cmd/Ctrl: start radius measurement from this token's center
                isMeasuring.value = false
                measureWaypoints.value = []
                measureCurrent.value = null
                const halfPx = (item.size * (isWorldMap ? 1 : gridSize.value)) / 2
                isRadiusMeasuring.value = true
                radiusOrigin.value = { x: item.x + halfPx, y: item.y + halfPx }
                radiusCurrent.value = { x: item.x + halfPx, y: item.y + halfPx }
                _radiusSourceTokenId = item.characterId ?? item.id
            } else {
                // Shift+click: start linear measurement from this token's center
                if (isRadiusMeasuring.value) {
                    isRadiusMeasuring.value = false
                    radiusOrigin.value = null
                    radiusCurrent.value = null
                    _radiusSourceTokenId = null
                }
                const halfPx = (item.size * (isWorldMap ? 1 : gridSize.value)) / 2
                isMeasuring.value = true
                measureWaypoints.value = [{ x: item.x + halfPx, y: item.y + halfPx }]
                measureCurrent.value = { x: item.x + halfPx, y: item.y + halfPx }
                _canvasMeasureDragging = false
            }
            return
        }

        // Cancel any active radius measurement when starting a token drag
        if (isRadiusMeasuring.value) {
            isRadiusMeasuring.value = false
            radiusOrigin.value = null
            radiusCurrent.value = null
            _radiusSourceTokenId = null
        }

        // Clicking a token deselects any selected radius area
        selectedRadiusAreaId.value = null

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

        // Prepare measurement tracks but don't show the overlay yet.
        // isMeasuring is set to true in handleGlobalMousemove once the token
        // has moved at least one grid square, preventing the brief flash that
        // would appear on a plain click-without-drag.
        measureTracks.value = itemsToDrag.map(({ id, startX, startY }) => {
            const i = canvasItemsById.value.get(id)
            const halfPx = (i.size * (isWorldMap ? 1 : gridSize.value)) / 2
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

        // Culture token drag (world map)
        const dCulture = draggingCulture.value
        if (dCulture) {
            const pos = _containerPos(e)
            if (!pos) return
            const halfPx = (dCulture.size || cultureTokenSize.value) / 2
            dropGhost.value = {
                ...dCulture,
                x: pos.canvasX - halfPx,
                y: pos.canvasY - halfPx,
            }
            return
        }

        // Group drag: show one ghost per unplaced member, spread in a grid
        const dg = draggingGroup.value
        if (dg?.length) {
            const pos = _containerPos(e)
            if (!pos) return
            const cols = Math.ceil(Math.sqrt(dg.length))
            dropGhosts.value = dg.map((snapshot, i) => {
                const col = i % cols
                const row = Math.floor(i / cols)
                const halfPx = ((snapshot.size || 1) * gridSize.value) / 2
                return {
                    ...snapshot,
                    x: snap(pos.canvasX - halfPx) + col * gridSize.value,
                    y: snap(pos.canvasY - halfPx) + row * gridSize.value,
                }
            })
            return
        }

        const dc = draggingCharacter.value
        if (!dc) return
        const pos = _containerPos(e)
        if (!pos) return
        const halfPx = isWorldMap ? characterTokenSize.value / 2 : ((dc.size || 1) * gridSize.value) / 2
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
            dropGhosts.value = []
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()

        // Handle culture token drop (world map)
        const rawCulture = e.dataTransfer.getData('application/vtt-culture')
        if (rawCulture) {
            let snapshot
            try { snapshot = JSON.parse(rawCulture) } catch { return }
            const pos = _containerPos(e)
            if (!pos) return
            const halfPx = (snapshot.size || cultureTokenSize.value) / 2
            const x = pos.canvasX - halfPx
            const y = pos.canvasY - halfPx
            recordSnapshot()
            // Remove any existing token for the same culture (only one pin per culture)
            canvasItems.value = canvasItems.value.filter(
                i => !(i.tokenType === 'culture' && i.cultureId === snapshot.cultureId)
            )
            topZIndex.value += 1
            canvasItems.value.push({
                id: crypto.randomUUID(),
                tokenType: 'culture',
                cultureId: snapshot.cultureId,
                name: snapshot.name ?? 'Unknown',
                portraitUrl: snapshot.portraitUrl ?? null,
                size: snapshot.size || cultureTokenSize.value,
                x,
                y,
                zIndex: topZIndex.value,
            })
            dropGhost.value = null
            clearDraggingCulture()
            saveState()
            return
        }

        // Handle character token drop
        const raw = e.dataTransfer.getData('application/vtt-character')
        if (raw) {
            let snapshot
            try { snapshot = JSON.parse(raw) } catch { return }
            const pos = _containerPos(e)
            if (!pos) return
            const halfPx = isWorldMap ? characterTokenSize.value / 2 : ((snapshot.size || 1) * gridSize.value) / 2
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
            return
        }

        // Handle group drag drop: place all unplaced members spread in a grid
        const rawGroup = e.dataTransfer.getData('application/vtt-group')
        if (rawGroup) {
            let snapshots
            try { snapshots = JSON.parse(rawGroup) } catch { return }
            if (!snapshots?.length) return
            const pos = _containerPos(e)
            if (!pos) return
            recordSnapshot()
            const cols = Math.ceil(Math.sqrt(snapshots.length))
            snapshots.forEach((snapshot, i) => {
                const col = i % cols
                const row = Math.floor(i / cols)
                const halfPx = ((snapshot.size || 1) * gridSize.value) / 2
                const x = snap(pos.canvasX - halfPx) + col * gridSize.value
                const y = snap(pos.canvasY - halfPx) + row * gridSize.value
                // Remove any existing token for the same character
                if (snapshot.characterId) {
                    canvasItems.value = canvasItems.value.filter(i => i.characterId !== snapshot.characterId)
                }
                _placeToken(snapshot, x, y)
            })
            dropGhosts.value = []
            clearDraggingGroup()
            saveState()
        }
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
                        if (item.tokenType === 'culture' && cultureTokensLocked.value) continue
                        const sz = isWorldMap ? item.size : item.size * gridSize.value
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

        // ── Area anchor drag ────────────────────────────────────────────────
        if (_areaMoveState) {
            const dx = (e.clientX - _areaMoveState.startMouseX) / transform.value.scale
            const dy = (e.clientY - _areaMoveState.startMouseY) / transform.value.scale
            const area = radiusAreas.value.find(a => a.id === _areaMoveState.areaId)
            if (area) {
                area.originX = snapCenter(_areaMoveState.originX + dx)
                area.originY = snapCenter(_areaMoveState.originY + dy)
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

            // Enable measurement overlay once the token has moved at least one grid square,
            // preventing the brief flash that would appear on a plain click.
            if (!isMeasuring.value && (Math.abs(dx) >= gridSize.value || Math.abs(dy) >= gridSize.value)) {
                isMeasuring.value = true
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
                    isNpc: dragItem.isNpc ?? false,
                    tokenType: dragItem.tokenType,
                    cultureId: dragItem.cultureId,
                })
                if (isMeasuring.value && newTracks[idx]) {
                    const halfPx = (dragItem.size * (isWorldMap ? 1 : gridSize.value)) / 2
                    newTracks[idx] = {
                        ...newTracks[idx],
                        currentPoint: { x: snappedX + halfPx, y: snappedY + halfPx },
                    }
                }
            }
            tokenGhosts.value = newGhosts
            if (isMeasuring.value) measureTracks.value = newTracks
            // Live-update radius areas linked to dragged tokens
            for (const { id, startX, startY } of ds.items) {
                const dragItem = canvasItemsById.value.get(id)
                if (!dragItem) continue
                const snappedX = snap(startX + dx)
                const snappedY = snap(startY + dy)
                const halfPx = (dragItem.size * gridSize.value) / 2
                const charId = dragItem.characterId ?? dragItem.id
                for (const area of radiusAreas.value) {
                    if (area.tokenId === charId) {
                        area.originX = snappedX + halfPx
                        area.originY = snappedY + halfPx
                    }
                }
            }
            return
        }

        // Update canvas measurement current point(s) (no token drag active)
        const pos = _containerPos(e)
        hoveredCanvasPos.value = pos
        if (pos) {
            if (isMeasuring.value) {
                measureCurrent.value = { x: snapCenter(pos.canvasX), y: snapCenter(pos.canvasY) }
            }
            if (isRadiusMeasuring.value) {
                radiusCurrent.value = { x: pos.canvasX, y: pos.canvasY }
            }
            // Compute which area (if any) the cursor is inside — topmost wins
            let newHoveredId = null
            for (let i = radiusAreas.value.length - 1; i >= 0; i--) {
                const area = radiusAreas.value[i]
                const r = area.radiusFeet * gridSize.value / 5
                const dx = pos.canvasX - area.originX
                const dy = pos.canvasY - area.originY
                if (dx * dx + dy * dy <= r * r) { newHoveredId = area.id; break }
            }
            hoveringRadiusAreaId.value = newHoveredId
        } else {
            hoveringRadiusAreaId.value = null
        }
    }

    // ─── Radius area helpers ──────────────────────────────────────────────────
    // Named range values (feet). Shift-held snaps to these; otherwise 5ft grid.
    const _RADIUS_RANGE_FEET = [5, 25, 50, 100, 200]

    const _computeRadiusFeet = (originX, originY, currentX, currentY, shiftHeld) => {
        const dx = currentX - originX
        const dy = currentY - originY
        const rawPx = Math.sqrt(dx * dx + dy * dy)
        const rawFeet = rawPx * 5 / gridSize.value
        if (shiftHeld) {
            // Snap to nearest named range
            return _RADIUS_RANGE_FEET.reduce((best, feet) =>
                Math.abs(feet - rawFeet) < Math.abs(best - rawFeet) ? feet : best,
                _RADIUS_RANGE_FEET[0])
        }
        // Default: always snap to 5ft grid, minimum 5ft
        return Math.max(5, Math.round(rawFeet / 5) * 5)
    }

    const _commitRadiusArea = () => {
        if (!radiusOrigin.value || !radiusCurrent.value) return
        const feet = _computeRadiusFeet(
            radiusOrigin.value.x, radiusOrigin.value.y,
            radiusCurrent.value.x, radiusCurrent.value.y,
            isShiftHeld.value
        )
        if (feet < 1) return
        // If editing an existing area, update it and bring it to front
        if (editingRadiusAreaId.value) {
            const idx = radiusAreas.value.findIndex(a => a.id === editingRadiusAreaId.value)
            if (idx !== -1) {
                const area = radiusAreas.value[idx]
                area.originX = radiusOrigin.value.x
                area.originY = radiusOrigin.value.y
                area.radiusFeet = feet
                radiusAreas.value.splice(idx, 1)
                radiusAreas.value.push(area)
            }
            editingRadiusAreaId.value = null
        } else {
            radiusAreas.value.push({
                id: crypto.randomUUID(),
                originX: radiusOrigin.value.x,
                originY: radiusOrigin.value.y,
                radiusFeet: feet,
                color: '#ffffff',
                label: '',
                tokenId: _radiusSourceTokenId ?? null,
            })
        }
        isRadiusMeasuring.value = false
        radiusOrigin.value = null
        radiusCurrent.value = null
        _radiusSourceTokenId = null
        saveState()
    }

    const removeRadiusArea = (id) => {
        radiusAreas.value = radiusAreas.value.filter(a => a.id !== id)
        if (selectedRadiusAreaId.value === id) selectedRadiusAreaId.value = null
        saveState()
    }

    const setRadiusAreaColor = (id, color) => {
        const area = radiusAreas.value.find(a => a.id === id)
        if (area) { area.color = color; saveState() }
    }

    const setRadiusAreaLabel = (id, label) => {
        const area = radiusAreas.value.find(a => a.id === id)
        if (area) { area.label = label; saveState() }
    }

    const beginEditRadiusArea = (id) => {
        const area = radiusAreas.value.find(a => a.id === id)
        if (!area) return
        editingRadiusAreaId.value = id
        isRadiusMeasuring.value = true
        radiusOrigin.value = { x: area.originX, y: area.originY }
        // Place current at the east edge so the measurement overlay has a starting point
        const radiusPx = area.radiusFeet * gridSize.value / 5
        radiusCurrent.value = { x: area.originX + radiusPx, y: area.originY }
        _radiusSourceTokenId = area.tokenId ?? null
    }

    // Moves a radius area to the top of the rendering stack (end of the array).
    const bringRadiusAreaToFront = (areaId) => {
        const idx = radiusAreas.value.findIndex(a => a.id === areaId)
        if (idx !== -1 && idx !== radiusAreas.value.length - 1) {
            const [area] = radiusAreas.value.splice(idx, 1)
            radiusAreas.value.push(area)
        }
    }

    // Called by the overlay when the user mousedowns on an area's edge outline.
    // Puts the area into resize-drag mode; mouseup commits the new radius.
    const beginRadiusResize = (areaId) => {
        bringRadiusAreaToFront(areaId)
        beginEditRadiusArea(areaId)
        _isResizeDrag = true
    }

    // Called by the overlay when the user mousedowns on a free area's anchor circle.
    // Drag moves the area origin; mouseup snaps and commits.
    const beginAreaMove = (areaId, clientX, clientY) => {
        const area = radiusAreas.value.find(a => a.id === areaId)
        if (!area) return
        _areaMoveState = {
            areaId,
            originX: area.originX,
            originY: area.originY,
            startMouseX: clientX,
            startMouseY: clientY,
        }
        bringRadiusAreaToFront(areaId)
    }

    const handleGlobalMouseup = () => {
        // ── Area anchor drag: snap origin and commit ─────────────────────────
        if (_areaMoveState) {
            const area = radiusAreas.value.find(a => a.id === _areaMoveState.areaId)
            if (area) {
                area.originX = snapCenter(area.originX)
                area.originY = snapCenter(area.originY)
            }
            _areaMoveState = null
            saveState()
            return
        }

        // ── Edge resize drag: commit the new radius on mouseup ───────────────
        if (_isResizeDrag) {
            _isResizeDrag = false
            if (isRadiusMeasuring.value && radiusOrigin.value && radiusCurrent.value) {
                _commitRadiusArea()
            } else {
                isRadiusMeasuring.value = false
                radiusOrigin.value = null
                radiusCurrent.value = null
                _radiusSourceTokenId = null
                editingRadiusAreaId.value = null
            }
            return
        }

        // Stop radius measurement on any other mouseup
        if (isRadiusMeasuring.value && !isPanning.value) {
            isRadiusMeasuring.value = false
            radiusOrigin.value = null
            radiusCurrent.value = null
            _radiusSourceTokenId = null
        }

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
                        if (item.tokenType === 'culture' && cultureTokensLocked.value) continue
                        const sz = isWorldMap ? item.size : item.size * gridSize.value
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
                        // Update any radius areas linked to this token
                        const charId = item.characterId ?? item.id
                        const halfPx = (item.size * gridSize.value) / 2
                        for (const area of radiusAreas.value) {
                            if (area.tokenId === charId) {
                                area.originX = snappedX + halfPx
                                area.originY = snappedY + halfPx
                            }
                        }
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
            isNpc: snapshot.isNpc ?? false,
            name: snapshot.name ?? 'Unknown',
            portraitUrl: snapshot.portraitUrl ?? null,
            size: isWorldMap ? characterTokenSize.value : (snapshot.size || 1),
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

    const clearAll = async () => {
        const { confirm } = useConfirm()
        if (!await confirm('Remove all tokens from the tabletop?')) return
        recordSnapshot()
        canvasItems.value = []
        selectedIds.value = new Set()
        saveState()
    }

    const setTokenVisibility = (id, hidden) => {
        const item = canvasItems.value.find(i => i.id === id)
        if (!item) return
        item.isHidden = hidden
        saveState()
    }

    const clearRollLog = () => {
        rollLog.value = []
        saveState()
    }

    // ─── Keyboard ─────────────────────────────────────────────────────────────
    const handleGlobalKeydown = (e) => {
        const tag = document.activeElement?.tagName?.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) return

        // Track modifier keys for measurement modes
        if (e.key === 'Meta' || e.key === 'Control') isCmdHeld.value = true
        if (e.key === 'Shift') isShiftHeld.value = true
        if (e.key === 'Alt') isAltHeld.value = true

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

        if (e.key === 'Shift' && isMeasuring.value) {
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

        if (e.key === 'Escape') {
            if (isMeasuring.value && !dragState.value) {
                e.preventDefault()
                isMeasuring.value = false
                measureWaypoints.value = []
                measureCurrent.value = null
            }
            if (isRadiusMeasuring.value) {
                e.preventDefault()
                isRadiusMeasuring.value = false
                radiusOrigin.value = null
                radiusCurrent.value = null
                _radiusSourceTokenId = null
                editingRadiusAreaId.value = null
                _isResizeDrag = false
            }
            if (selectedRadiusAreaId.value) {
                e.preventDefault()
                selectedRadiusAreaId.value = null
            }
        }

        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRadiusAreaId.value && selectedIds.value.size === 0) {
            e.preventDefault()
            removeRadiusArea(selectedRadiusAreaId.value)
        }
    }

    const handleGlobalKeyup = (e) => {
        if (e.key === 'Meta' || e.key === 'Control') isCmdHeld.value = false
        if (e.key === 'Shift') isShiftHeld.value = false
        if (e.key === 'Alt') isAltHeld.value = false
    }

    // Reset modifier keys when the window loses focus or the tab is hidden.
    // Without this, pressing Shift on another tab leaves isShiftHeld stuck true,
    // causing the cursor to appear in ruler mode when returning to the tabletop.
    const handleWindowBlur = () => {
        isShiftHeld.value = false
        isCmdHeld.value = false
        isAltHeld.value = false
    }
    const handleVisibilityChange = () => {
        if (document.visibilityState !== 'visible') return
        isShiftHeld.value = false
        isCmdHeld.value = false
        isAltHeld.value = false
    }

    // ─── Persistence ─────────────────────────────────────────────────────────
    const saveState = () => {
        // Guard: never persist while the canvas is in its reset/default state.
        // This prevents overwriting real tabletop data when loadState() hasn't
        // been called yet (e.g. the user scrolls or zooms before auth completes).
        if (!_stateReady) {
            console.warn('[VTT] saveState blocked: state not yet loaded for this tabletop')
            return
        }
        // Guard: do not echo back state that was just applied from an external sync.
        if (_applyingExternalState) return

        const cid = typeof campaignId === 'object' ? campaignId.value : campaignId
        const tid = typeof tabletopId === 'object' ? tabletopId.value : tabletopId
        if (!cid || !tid) return
        if (_saveTimer) clearTimeout(_saveTimer)
        // Snapshot current state immediately so that any resets that occur between
        // this call and the timer firing do not corrupt the saved payload.
        // NOTE: transform is excluded from the sync snapshot (each user has their
        // own viewport) but IS saved to the REST API for personal persistence.
        const snapshot = {
            items: JSON.parse(JSON.stringify(canvasItems.value)),
            backgroundImage: backgroundImage.value ? { ...backgroundImage.value } : null,
            gridSize: gridSize.value,
            gridColor: gridColor.value,
            gridOpacity: gridOpacity.value,
            mapScale: mapScale.value,
            showPaths: showPaths.value,
            radiusAreas: JSON.parse(JSON.stringify(radiusAreas.value)),
            rollLog: JSON.parse(JSON.stringify(rollLog.value)),
            pixelsPerMile: pixelsPerMile.value,
            characterTokenSize: characterTokenSize.value,
            cultureTokenSize: cultureTokenSize.value,
            cultureTokensLocked: cultureTokensLocked.value,
        }
        _saveTimer = setTimeout(() => {
            // Safety guard: abort if the active tabletop has changed since this
            // save was scheduled (watch handler should have cancelled the timer,
            // but this is defence-in-depth).
            const currentTid = typeof tabletopId === 'object' ? tabletopId.value : tabletopId
            if (currentTid !== tid) return
            campaignStore.updateTabletop(cid, tid, { ...snapshot, transform: { ...transform.value }, rollLogExpanded: rollLogExpanded.value })
                .then(() => {
                    console.log('[VTT] State persisted; calling onStateSaved to broadcast via socket')
                    onStateSaved?.(snapshot)
                })
                .catch((err) => console.warn('[VTT] Failed to persist tabletop state:', err))
        }, 500)
    }

    /**
     * Apply a canvas state snapshot received from another user via the socket.
     * This updates all shared canvas state WITHOUT triggering another save/broadcast.
     * The user's own transform (viewport) and any measurement state are NOT touched.
     *
     * @param {Object} snapshot - Partial canvas state (items, grid, background, etc.)
     */
    const applyExternalState = (snapshot) => {
        if (!snapshot) return
        _applyingExternalState = true
        try {
            if (Array.isArray(snapshot.items)) {
                snapshot.items.forEach((item, i) => {
                    if (item.zIndex == null) item.zIndex = i + 1
                })
                canvasItems.value = snapshot.items
                topZIndex.value = Math.max(1, ...snapshot.items.map((i) => i.zIndex ?? 0))
            }
            if (snapshot.backgroundImage !== undefined) backgroundImage.value = snapshot.backgroundImage
            if (snapshot.gridSize != null) gridSize.value = snapshot.gridSize
            if (snapshot.gridColor) gridColor.value = snapshot.gridColor
            if (snapshot.gridOpacity != null) gridOpacity.value = snapshot.gridOpacity
            if (snapshot.mapScale != null) mapScale.value = snapshot.mapScale
            if (Array.isArray(snapshot.radiusAreas)) radiusAreas.value = snapshot.radiusAreas
            if (Array.isArray(snapshot.rollLog)) rollLog.value = snapshot.rollLog
            if (snapshot.pixelsPerMile != null) pixelsPerMile.value = snapshot.pixelsPerMile
            if (snapshot.characterTokenSize != null) characterTokenSize.value = snapshot.characterTokenSize
            if (snapshot.cultureTokenSize != null) cultureTokenSize.value = snapshot.cultureTokenSize
            if (snapshot.cultureTokensLocked != null) cultureTokensLocked.value = snapshot.cultureTokensLocked
        } finally {
            _applyingExternalState = false
        }
    }

    const loadState = () => {
        // Mark not-ready until we confirm the tabletop exists in the store.
        _stateReady = false
        const tid = typeof tabletopId === 'object' ? tabletopId.value : tabletopId
        const tabletop = campaignStore.tabletops.find((t) => t.id === tid)
        if (!tabletop) {
            console.warn(`[VTT] loadState: tabletop "${tid}" not found in store (${campaignStore.tabletops.length} tabletop(s) available). State will not be saved until it is loaded.`)
            return
        }
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
        if (tabletop.mapScale != null) mapScale.value = tabletop.mapScale
        if (Array.isArray(tabletop.radiusAreas)) radiusAreas.value = tabletop.radiusAreas
        if (Array.isArray(tabletop.rollLog)) rollLog.value = tabletop.rollLog
        if (tabletop.rollLogExpanded != null) rollLogExpanded.value = tabletop.rollLogExpanded
        if (tabletop.pixelsPerMile != null) pixelsPerMile.value = tabletop.pixelsPerMile
        if (tabletop.characterTokenSize != null) characterTokenSize.value = tabletop.characterTokenSize
        if (tabletop.cultureTokenSize != null) cultureTokenSize.value = tabletop.cultureTokenSize
        if (tabletop.cultureTokensLocked != null) cultureTokensLocked.value = tabletop.cultureTokensLocked
        _stateReady = true
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
            mapScale.value = 1
            showPaths.value = true
            _undoStack.length = 0
            _redoStack.length = 0
            _undoCount.value = 0
            _redoCount.value = 0
            selectedIds.value = new Set()
            topZIndex.value = 1
            isRadiusMeasuring.value = false
            radiusOrigin.value = null
            radiusCurrent.value = null
            _radiusSourceTokenId = null
            editingRadiusAreaId.value = null
            _isResizeDrag = false
            _areaMoveState = null
            isShiftHeld.value = false
            radiusAreas.value = []
            selectedRadiusAreaId.value = null
            hoveringRadiusAreaId.value = null
            hoveredCanvasPos.value = null
            rollLog.value = []
            rollLogExpanded.value = false
            pixelsPerMile.value = 40
            characterTokenSize.value = 40
            cultureTokenSize.value = 60
            cultureTokensLocked.value = false
            loadState()
        }
    )

    // ─── Global right-click → commit radius area ──────────────────────────────
    const handleGlobalMousedown = (e) => {
        if (e.button === 2 && isRadiusMeasuring.value) {
            e.preventDefault()
            _commitRadiusArea()
        }
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────
    onMounted(() => {
        window.addEventListener('mousedown', handleGlobalMousedown, true)
        window.addEventListener('mousemove', handleGlobalMousemove)
        window.addEventListener('mouseup', handleGlobalMouseup)
        window.addEventListener('keydown', handleGlobalKeydown)
        window.addEventListener('keyup', handleGlobalKeyup)
        window.addEventListener('blur', handleWindowBlur)
        document.addEventListener('visibilitychange', handleVisibilityChange)
    })

    onUnmounted(() => {
        _stateReady = false
        if (_saveTimer) clearTimeout(_saveTimer)
        window.removeEventListener('mousedown', handleGlobalMousedown, true)
        window.removeEventListener('mousemove', handleGlobalMousemove)
        window.removeEventListener('mouseup', handleGlobalMouseup)
        window.removeEventListener('keydown', handleGlobalKeydown)
        window.removeEventListener('keyup', handleGlobalKeyup)
        window.removeEventListener('blur', handleWindowBlur)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        clearSelectedCharacterIds()
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
        isDragActive: computed(() => dragState.value !== null),
        isPanning,
        isSelecting,
        selectionRectCanvas,
        isMeasuring,
        measureTracks,
        measureWaypoints,
        measureCurrent,
        isCmdHeld,
        isShiftHeld,
        isAltHeld,
        isRadiusMeasuring,
        radiusOrigin,
        radiusCurrent,
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
        mapScale,
        increaseMapScale,
        decreaseMapScale,
        setBackgroundImage,
        clearBackgroundImage,
        setGridColor,
        setGridOpacity,
        showPaths,
        radiusAreas,
        selectedRadiusAreaId,
        editingRadiusAreaId,
        hoveringRadiusAreaId,
        hoveredCanvasPos,
        removeRadiusArea,
        setRadiusAreaColor,
        setRadiusAreaLabel,
        beginEditRadiusArea,
        beginRadiusResize,
        beginAreaMove,
        bringRadiusAreaToFront,
        setTokenVisibility,
        removeToken,
        clearAll,
        loadState,
        saveState,
        recordSnapshot,
        rollLog,
        rollLogExpanded,
        setRollLogExpanded,
        clearRollLog,
        applyExternalState,
        pixelsPerMile,
        increasePixelsPerMile,
        decreasePixelsPerMile,
        characterTokenSize,
        cultureTokenSize,
        cultureTokensLocked,
        setCharacterTokenSize,
        setCultureTokenSize,
        setCultureTokensLocked,
        removeCultureToken,
    }
}
