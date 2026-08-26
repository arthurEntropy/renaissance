import { ref, watch, onUnmounted } from 'vue'
import { useRollsStore } from '@/stores/rollsStore'
import { RollTypes } from '@/constants/rollTypes'
import tabletopSocketService from '@/services/sessions/tabletopSocketService'
import { TABLETOP_EVENTS } from '@shared/constants/tabletopSocketEvents.js'

const MAX_LOG_ENTRIES = 100

/**
 * Derives a compact single emoji for the bubble from the roll data.
 * Priority: 🌞 > 💀 > ✨ > success/failure indicator.
 */
function getCompactEmoji(entry) {
  const dice = entry.diceResults || []
  if (dice.some((d) => d.emoji === '🌞')) return '🌞'
  if (dice.some((d) => d.emoji === '💀')) return '💀'
  if (entry.type === RollTypes.SKILL_CHECK && entry.success !== null) {
    return entry.success ? '🌞' : '💀'
  }
  if (dice.some((d) => d.emoji === '✨')) return '✨'
  return null
}

/**
 * Returns a compact total string for the bubble.
 * - Engagement: "3 to 2"
 * - Others: the numeric total
 */
function getCompactTotal(entry) {
  if (entry.type === RollTypes.ENGAGEMENT) {
    return `${entry.userWins ?? 0} to ${entry.opponentWins ?? 0}`
  }
  return entry.total != null ? String(entry.total) : '—'
}

/**
 * Converts a raw roll result (from rollsStore) + the matching canvas item into
 * a serialisable RollLogEntry suitable for persisting and broadcasting.
 */
function buildRollLogEntry(rollResult, canvasItem) {
  return {
    id: `${rollResult.rollCharacterId}_${rollResult.timestamp}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: rollResult.timestamp || Date.now(),
    characterId: canvasItem.characterId,
    characterName: canvasItem.name,
    portraitUrl: canvasItem.portraitUrl ?? null,
    isNpc: canvasItem.isNpc ?? false,
    isBeast: canvasItem.isBeast ?? false,
    type: rollResult.type ?? 'unknown',
    // Prefer baseSkillName (without favored suffix) to avoid duplication with favoredStatus field
    skillName: rollResult.baseSkillName ?? rollResult.skillName ?? null,
    total: rollResult.total ?? null,
    diceTotal: rollResult.diceTotal ?? null,
    modifier: rollResult.modifier ?? 0,
    modifierLabel: rollResult.modifierLabel ?? null,
    success: rollResult.success ?? null,
    difficulty: rollResult.difficulty ?? null,
    footer: rollResult.footer ?? null,
    favoredStatus: rollResult.favoredStatus ?? null,
    userWins: rollResult.userWins ?? null,
    opponentWins: rollResult.opponentWins ?? null,
    drawCount: rollResult.drawCount ?? null,
    result: rollResult.result ?? null,
    opponentName: rollResult.opponentName ?? null,
    sourceName: rollResult.sourceName ?? null,
    diceResults: (rollResult.diceResults || []).map((d) => ({
      dieSize: d.die?.dieSize ?? d.dieSize ?? 0,
      dieRollValue: d.dieRollValue ?? 0,
      emoji: d.emoji ?? null,
      isDropped: d.isDropped ?? false,
      rolledMaxValue: d.rolledMaxValue ?? false,
      cssClass: d.cssClass ?? '',
    })),
  }
}

/**
 * Manages the tabletop roll log (persisted via `rollLog` ref injected from
 * `useTabletopCanvas`) and session-only speech bubble state.
 *
 * @param {Object} opts
 * @param {import('vue').Ref<import('@shared/types/tabletop.js').TabletopCanvasItem[]>} opts.canvasItems
 * @param {import('vue').Ref<import('@shared/types/tabletop.js').RollLogEntry[]>} opts.rollLog
 *   The reactive ref owned by `useTabletopCanvas` – this composable mutates it.
 * @param {Function} opts.saveStateFn  Called after each local log entry to schedule persistence.
 * @param {import('vue').Ref<string|null>} opts.tabletopId
 * @param {import('vue').Ref<string|null>} opts.campaignId
 */
export function useTabletopRollLog({ canvasItems, rollLog, saveStateFn, tabletopId, campaignId }) {
  const rollsStore = useRollsStore()

  /**
   * Map of canvasItem.id → { entry, expanded }
   * Session-only (not persisted). Drives the speech bubble layer.
   */
  const activeBubbles = ref({})

  // Roll IDs we have already processed, to avoid reprocessing on re-renders.
  const _processedRollIds = new Set()

  // ── Bubble helpers ──────────────────────────────────────────────────────────

  function _showBubble(canvasItemId, entry) {
    activeBubbles.value = {
      ...activeBubbles.value,
      [canvasItemId]: { entry, expanded: false },
    }
  }

  function clearBubbles() {
    activeBubbles.value = {}
  }

  function toggleBubbleExpanded(canvasItemId) {
    const bubble = activeBubbles.value[canvasItemId]
    if (!bubble) return
    activeBubbles.value = {
      ...activeBubbles.value,
      [canvasItemId]: { ...bubble, expanded: !bubble.expanded },
    }
  }

  function dismissBubble(canvasItemId) {
    const next = { ...activeBubbles.value }
    delete next[canvasItemId]
    activeBubbles.value = next
  }

  // ── Engagement combining ────────────────────────────────────────────────────

  /**
   * When both sides of an engagement are in the log, merge them into a single
   * combined entry for a cleaner chatlog display.
   */
  function _createCombinedEngagementEntry(firstEntry, secondEntry) {
    return {
      id: firstEntry.id,
      timestamp: firstEntry.timestamp,
      type: RollTypes.ENGAGEMENT,
      combined: true,
      // First character
      characterId: firstEntry.characterId,
      characterName: firstEntry.characterName,
      portraitUrl: firstEntry.portraitUrl,
      isNpc: firstEntry.isNpc,
      isBeast: firstEntry.isBeast,
      result: firstEntry.result,
      userWins: firstEntry.userWins,
      opponentWins: firstEntry.opponentWins,
      diceResults: firstEntry.diceResults,
      // Second character
      opponentCharacterId: secondEntry.characterId,
      opponentName: firstEntry.opponentName,
      opponentPortraitUrl: secondEntry.portraitUrl,
      opponentIsNpc: secondEntry.isNpc,
      opponentIsBeast: secondEntry.isBeast,
      opponentResult: secondEntry.result,
      opponentDiceResults: secondEntry.diceResults,
    }
  }

  // ── Log helpers ─────────────────────────────────────────────────────────────

  /**
   * Appends an entry to the log (capping at MAX_LOG_ENTRIES), optionally
   * shows a bubble on the matching canvas item, persists the state, and
   * optionally broadcasts via socket.
   *
   * @param {import('@shared/types/tabletop.js').RollLogEntry} entry
   * @param {string|null} canvasItemId - If provided, shows a speech bubble on this item.
   * @param {boolean} fromSocket - When true, skips broadcasting to avoid echo loops.
   */
  function _appendEntry(entry, canvasItemId, fromSocket = false) {
    // Deduplicate: skip if an entry with the same characterId+timestamp already exists.
    // This guards against re-processing rollsById entries on component remount.
    const isDuplicate = rollLog.value.some(
      (e) => e.characterId === entry.characterId && e.timestamp === entry.timestamp
    )
    if (isDuplicate) return

    // For ENGAGEMENT rolls, try to combine with the opponent's matching entry already in the log.
    if (entry.type === RollTypes.ENGAGEMENT && !entry.combined) {
      const matchingIdx = rollLog.value.findIndex(
        (e) =>
          e.type === RollTypes.ENGAGEMENT &&
          !e.combined &&
          e.characterName === entry.opponentName &&
          e.opponentName === entry.characterName
      )
      if (matchingIdx !== -1) {
        const firstEntry = rollLog.value[matchingIdx]
        const combined = _createCombinedEngagementEntry(firstEntry, entry)
        const newLog = [...rollLog.value]
        newLog.splice(matchingIdx, 1, combined)
        rollLog.value = newLog
        // Still show an individual speech bubble for this character's result
        if (canvasItemId && entry.type !== RollTypes.CHAT_LINK) {
          _showBubble(canvasItemId, entry)
        }
        saveStateFn()
        if (!fromSocket && tabletopId.value && campaignId.value) {
          tabletopSocketService.broadcastRollLogged(tabletopId.value, campaignId.value, combined)
        }
        return
      }
    }

    const newLog = [...rollLog.value, entry]
    if (newLog.length > MAX_LOG_ENTRIES) newLog.shift()
    rollLog.value = newLog

    if (canvasItemId && entry.type !== RollTypes.CHAT_LINK) {
      _showBubble(canvasItemId, entry)
    }

    saveStateFn()

    if (!fromSocket && tabletopId.value && campaignId.value) {
      tabletopSocketService.broadcastRollLogged(tabletopId.value, campaignId.value, entry)
    }
  }

  // ── Watch rollsStore for new local rolls ────────────────────────────────────

  watch(
    () => rollsStore.rollsById,
    (newRolls) => {
      for (const [rollId, roll] of Object.entries(newRolls)) {
        if (_processedRollIds.has(rollId)) continue
        _processedRollIds.add(rollId)

        const canvasItem = canvasItems.value.find(
          (i) => i.characterId && i.characterId === roll.rollCharacterId
        )

        // Build the entry using canvas item data when available, falling back to
        // roll result data for characters not placed on this canvas (e.g. initiative
        // rolls for pinned-group members that don't have tokens).
        const entrySource = canvasItem ?? {
          characterId: roll.rollCharacterId,
          name: roll.characterName ?? 'Unknown',
          portraitUrl: null,
          isNpc: false,
          isBeast: false,
        }

        const entry = {
          ...buildRollLogEntry(roll, entrySource),
          wasTokenVisible: canvasItem != null && !(canvasItem.isHidden ?? false),
        }
        _appendEntry(entry, canvasItem?.id ?? null, false)
      }
    },
    { deep: true }
  )

  // ── Socket: receive remote roll events ──────────────────────────────────────

  function _onRollReceived({ entry }) {
    if (!entry) return

    // Combined engagement entries share the same id as the first participant's individual
    // entry, so we handle them before the generic ID dedup to avoid early-exit.
    if (entry.type === RollTypes.ENGAGEMENT && entry.combined) {
      const matchingIdx = rollLog.value.findIndex(
        (e) =>
          e.type === RollTypes.ENGAGEMENT &&
          e.characterId === entry.characterId &&
          e.timestamp === entry.timestamp
      )
      if (matchingIdx !== -1) {
        // Already combined (e.g. local echo) – nothing to do.
        if (rollLog.value[matchingIdx].combined) return
        const newLog = [...rollLog.value]
        newLog.splice(matchingIdx, 1, entry)
        rollLog.value = newLog
        // Show a bubble for the second participant (the opponent's canvas item)
        if (entry.opponentCharacterId) {
          const opponentCanvasItem = canvasItems.value.find(
            (i) => i.characterId === entry.opponentCharacterId
          )
          if (opponentCanvasItem) {
            const opponentEntry = {
              ...entry,
              characterId: entry.opponentCharacterId,
              characterName: entry.opponentName,
              userWins: entry.opponentWins,
              opponentWins: entry.userWins,
              result: entry.opponentResult ?? entry.result,
            }
            _showBubble(opponentCanvasItem.id, opponentEntry)
          }
        }
        saveStateFn()
        return
      }
      // No matching individual entry – fall through to add combined as a new entry.
    }

    // Standard ID-based dedup for non-combined entries.
    if (rollLog.value.some((e) => e.id === entry.id)) return

    const canvasItem = canvasItems.value.find((i) => i.characterId === entry.characterId)
    _appendEntry(entry, canvasItem?.id ?? null, true)
  }

  tabletopSocketService.on(TABLETOP_EVENTS.ROLL_RECEIVED, _onRollReceived)

  onUnmounted(() => {
    tabletopSocketService.off(TABLETOP_EVENTS.ROLL_RECEIVED, _onRollReceived)
  })

  // ── Exports ─────────────────────────────────────────────────────────────────

  return {
    activeBubbles,
    clearBubbles,
    toggleBubbleExpanded,
    dismissBubble,
    getCompactEmoji,
    getCompactTotal,
  }
}
