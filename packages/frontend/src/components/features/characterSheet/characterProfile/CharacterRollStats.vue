<template>
    <div class="roll-stats-section">
        <div class="roll-stats-divider"></div>

        <h3 class="roll-stats-title">Character Roll Stats</h3>

        <div class="roll-stats-content roll-stats-shell">
            <div class="roll-stats-row">
                <span class="roll-stats-label">Date Created</span>
                <span class="roll-stats-dots" aria-hidden="true"></span>
                <span class="roll-stats-value">{{ dateCreated }}</span>
            </div>

            <div class="roll-stats-subheading">Skill Checks</div>

            <div class="roll-stats-row">
                <span class="roll-stats-label">Success Rate</span>
                <span class="roll-stats-dots" aria-hidden="true"></span>
                <span class="roll-stats-value">{{ successRate }}</span>
            </div>
            <div class="roll-stats-row">
                <span class="roll-stats-label">Attempts / Successes</span>
                <span class="roll-stats-dots" aria-hidden="true"></span>
                <span class="roll-stats-value">{{ skillCheckAttempts }} / {{ skillCheckSuccesses }}</span>
            </div>
            <div class="roll-stats-row">
                <span class="roll-stats-label">Avg Total / Best Total</span>
                <span class="roll-stats-dots" aria-hidden="true"></span>
                <span class="roll-stats-value">{{ averageSkillTotal }} / {{ bestSkillTotal }}</span>
            </div>
            <div class="roll-stats-row">
                <span class="roll-stats-label">Hardest Success</span>
                <span class="roll-stats-dots" aria-hidden="true"></span>
                <span class="roll-stats-value">{{ hardestSuccessLabel }}</span>
            </div>
            <div class="roll-stats-row">
                <span class="roll-stats-label">Favorite Skill</span>
                <span class="roll-stats-dots" aria-hidden="true"></span>
                <span class="roll-stats-value">{{ favoriteSkillLabel }}</span>
            </div>
            <div class="roll-stats-row">
                <span class="roll-stats-label">Sol</span>
                <span class="roll-stats-dots" aria-hidden="true"></span>
                <span class="roll-stats-value">{{ skillSolCount }}</span>
            </div>
            <div class="roll-stats-row">
                <span class="roll-stats-label">Morte</span>
                <span class="roll-stats-dots" aria-hidden="true"></span>
                <span class="roll-stats-value">{{ skillMorteCount }}</span>
            </div>
            <div class="roll-stats-row">
                <span class="roll-stats-label">Successes</span>
                <span class="roll-stats-dots" aria-hidden="true"></span>
                <span class="roll-stats-value">{{ skillSuccessCount }}</span>
            </div>

            <div class="roll-stats-subheading">Contests</div>

            <div class="roll-stats-row">
                <span class="roll-stats-label">Engagement W/L/D</span>
                <span class="roll-stats-dots" aria-hidden="true"></span>
                <span class="roll-stats-value">{{ engagementRecord }}</span>
            </div>
            <div class="roll-stats-row">
                <span class="roll-stats-label">Opposed W/L/D</span>
                <span class="roll-stats-dots" aria-hidden="true"></span>
                <span class="roll-stats-value">{{ opposedRecord }}</span>
            </div>

            <div class="roll-stats-actions">
                <ActionButton variant="neutral" size="small" text="Reset" @click="emit('reset-stats')" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { normalizeRollStats } from '@/services/rolls/rollStatsService'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const charactersStore = useCharactersStore()

const emit = defineEmits(['reset-stats'])

const character = computed(() => charactersStore.selectedCharacter)

const characterRollStats = computed(() => normalizeRollStats(character.value?.rollStats))

const dateCreated = computed(() => {
    if (!character.value?.createdAt) return 'Unknown'

    const createdAt = new Date(character.value.createdAt)
    if (Number.isNaN(createdAt.getTime())) return 'Unknown'

    return createdAt.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
})

const skillCheckAttempts = computed(() => characterRollStats.value.skillChecks.attempts || 0)
const skillCheckSuccesses = computed(() => characterRollStats.value.skillChecks.successes || 0)

const successRate = computed(() => {
    if (!skillCheckAttempts.value) return '0%'
    return `${Math.round((skillCheckSuccesses.value / skillCheckAttempts.value) * 100)}%`
})

const averageSkillTotal = computed(() => {
    if (!skillCheckAttempts.value) return '0.0'
    return (characterRollStats.value.skillChecks.totalSum / skillCheckAttempts.value).toFixed(1)
})

const bestSkillTotal = computed(() => {
    const bestTotal = characterRollStats.value.skillChecks.bestTotal
    return bestTotal === null ? '—' : bestTotal
})

const hardestSuccessLabel = computed(() => {
    const hardestSuccess = characterRollStats.value.skillChecks.hardestSuccess
    return hardestSuccess === null ? '—' : `Difficulty ${hardestSuccess}`
})

const favoriteSkillLabel = computed(() => {
    const bySkill = characterRollStats.value.skillChecks.bySkill || {}
    const entries = Object.entries(bySkill)

    if (!entries.length) return '—'

    const [skillName, count] = entries.reduce((best, current) => {
        return current[1] > best[1] ? current : best
    })

    return `${skillName} (${count})`
})

const skillSolCount = computed(() => characterRollStats.value.skillChecks.solCount || 0)
const skillMorteCount = computed(() => characterRollStats.value.skillChecks.morteCount || 0)
const skillSuccessCount = computed(() => characterRollStats.value.skillChecks.successCount || 0)

const engagementRecord = computed(() => {
    const engagement = characterRollStats.value.contests.engagement
    return `${engagement.wins || 0} / ${engagement.losses || 0} / ${engagement.draws || 0}`
})

const opposedRecord = computed(() => {
    const opposed = characterRollStats.value.contests.opposed
    return `${opposed.wins || 0} / ${opposed.losses || 0} / ${opposed.draws || 0}`
})

</script>

<style scoped>
.roll-stats-section {
    margin-top: var(--space-xl);
}

.roll-stats-divider {
    height: 1px;
    background-color: var(--color-gray-medium);
    margin-bottom: var(--space-lg);
}

.roll-stats-title {
    margin: 0;
    font-family: var(--font-family-dice);
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
}

.roll-stats-content {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin: var(--space-md) auto 0;
    width: 100%;
}

.roll-stats-shell {
    font-family: var(--font-family-dice);
    font-size: var(--font-size-14);
    line-height: 1.25;
    color: var(--color-text-primary);
    letter-spacing: 0;
    font-variant-ligatures: none;
    font-feature-settings: "liga" 0;
    overflow-x: hidden;
}

.roll-stats-row {
    display: flex;
    align-items: baseline;
    gap: 0;
    white-space: nowrap;
}

.roll-stats-subheading {
    margin-top: var(--space-sm);
    margin-bottom: 2px;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
}

.roll-stats-label {
    color: var(--color-gray-light);
}

.roll-stats-dots {
    flex: 1;
    min-width: 2ch;
    margin: 0 1ch;
    overflow: hidden;
    position: relative;
    color: var(--color-gray-medium);
}

.roll-stats-dots::before {
    content: '................................................................................................................................';
    display: block;
    white-space: nowrap;
}

.roll-stats-value {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
    text-align: right;
}

.roll-stats-actions {
    display: flex;
    justify-content: center;
    margin-top: var(--space-md);
}
</style>
