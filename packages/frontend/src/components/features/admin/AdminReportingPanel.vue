<template>
    <CollapsibleAdminSection title="Reporting">
        <div class="reporting-panel">
            <ActionButton variant="primary" size="small" text="Run Report" :disabled="isRunning" @click="runReport" />

            <div v-if="report" class="report-results">
                <!-- Skill mention counts -->
                <div class="report-section">
                    <h4 class="report-section-title">Skill Mention Counts</h4>
                    <p class="report-description">
                        Number of times each skill name appears in ability and equipment descriptions.
                    </p>
                    <div class="report-rows">
                        <div v-for="entry in report.skillCounts" :key="entry.skill" class="report-row">
                            <span class="report-label">{{ entry.skill }}</span>
                            <span class="report-value">{{ entry.count }}</span>
                        </div>
                    </div>
                </div>

                <!-- Roll vs. combination counts -->
                <div class="report-section">
                    <h4 class="report-section-title">Roll vs. Combinations</h4>
                    <p class="report-description">
                        Number of times each "Roll X vs Y" combination appears.
                    </p>
                    <div v-if="report.vsCounts.length > 0" class="report-rows">
                        <div v-for="entry in report.vsCounts" :key="entry.pair" class="report-row">
                            <span class="report-label">{{ entry.pair }}</span>
                            <span class="report-value">{{ entry.count }}</span>
                        </div>
                    </div>
                    <p v-else class="report-empty">No "vs" combinations found.</p>
                </div>
            </div>
        </div>
    </CollapsibleAdminSection>
</template>

<script setup>
import { ref } from 'vue'
import CollapsibleAdminSection from './CollapsibleAdminSection.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'

const abilitiesStore = useAbilitiesStore()
const equipmentStore = useEquipmentStore()

// Skill list — kept in sync with autoLinkifyRolls.js
const SKILLS = [
    'Awe', 'Strength', 'Dexterity', 'Fortitude', 'Craft',
    'Perform', 'Insight', 'Courtesy', 'Spirit', 'Aid',
    'Persuade', 'Awareness', 'Stealth', 'Lore', 'Riddle'
]

const SKILLS_PATTERN = SKILLS.join('|')

// Matches "Roll X vs Y" or "Roll X vs. Y"
const VS_PATTERN = new RegExp(
    `[Rr]oll\\s+(${SKILLS_PATTERN})\\s+vs\\.?\\s+(${SKILLS_PATTERN})`,
    'g'
)

// Matches any individual skill name as a whole word
const SKILL_WORD_PATTERN = new RegExp(`\\b(${SKILLS_PATTERN})\\b`, 'g')

/** Strip HTML tags from a description string. */
function stripHtml(html) {
    if (!html || typeof html !== 'string') return ''
    return html.replace(/<[^>]*>/g, ' ')
}

const isRunning = ref(false)
const report = ref(null)

function runReport() {
    isRunning.value = true
    try {
        // Collect all description text from abilities and equipment
        const allItems = [
            ...abilitiesStore.abilities,
            ...equipmentStore.equipment,
        ]

        const rawTexts = allItems
            .filter((item) => !item.isDeleted && item.description)
            .map((item) => stripHtml(item.description))

        // --- Skill mention counts ---
        const skillTotals = {}
        for (const skill of SKILLS) {
            skillTotals[skill] = 0
        }

        for (const text of rawTexts) {
            SKILL_WORD_PATTERN.lastIndex = 0
            let m
            while ((m = SKILL_WORD_PATTERN.exec(text)) !== null) {
                const skill = m[1]
                if (Object.prototype.hasOwnProperty.call(skillTotals, skill)) {
                    skillTotals[skill]++
                }
            }
        }

        const skillCounts = Object.entries(skillTotals)
            .map(([skill, count]) => ({ skill, count }))
            .filter((e) => e.count > 0)
            .sort((a, b) => b.count - a.count)

        // --- Roll vs. combination counts ---
        const vsTotals = {}
        for (const text of rawTexts) {
            VS_PATTERN.lastIndex = 0
            let m
            while ((m = VS_PATTERN.exec(text)) !== null) {
                const skillA = m[1]
                const skillB = m[2]
                // Normalise key so "A vs B" and "B vs A" are counted separately
                const key = `${skillA} vs ${skillB}`
                vsTotals[key] = (vsTotals[key] || 0) + 1
            }
        }

        const vsCounts = Object.entries(vsTotals)
            .map(([pair, count]) => ({ pair, count }))
            .sort((a, b) => b.count - a.count)

        report.value = { skillCounts, vsCounts }
    } finally {
        isRunning.value = false
    }
}
</script>

<style scoped>
.reporting-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
}

.report-results {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
}

.report-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.report-section-title {
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
}

.report-description {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
    margin: 0;
}

.report-rows {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.report-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2px var(--space-sm);
    border-radius: var(--radius-5);
    font-size: var(--font-size-13);
}

.report-row:nth-child(odd) {
    background: var(--overlay-black-light);
}

.report-label {
    color: var(--color-text-primary);
}

.report-value {
    font-weight: var(--font-weight-bold);
    color: var(--color-accent-gold);
    min-width: 2.5rem;
    text-align: right;
}

.report-empty {
    font-size: var(--font-size-13);
    color: var(--color-text-secondary);
    font-style: italic;
    margin: 0;
}
</style>
