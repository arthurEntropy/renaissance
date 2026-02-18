<template>
    <div class="roll-title">
        <span v-if="isEngagement">
            Engagement:
            <span class="skill-name">{{ rollData.characterName }}</span>
            vs
            <span class="skill-name">{{ rollData.opponentName }}</span>
        </span>

        <span v-else-if="isOpposedSkillCheck">
            Opposed:
            <span class="skill-name">{{ rollData.characterName }}</span>
            ({{ rollData.skillName }})
            vs
            <span class="skill-name">{{ rollData.opponentName }}</span>
            ({{ rollData.opponentSkillName }})
        </span>

        <span v-else-if="isCustomRoll">
            {{ rollData.characterName }} rolled
            <span class="skill-name">{{ rollData.skillName }}</span>
        </span>

        <span v-else-if="isInitiative">
            {{ rollData.characterName }} rolled
            <span class="skill-name">Initiative</span>
        </span>

        <span v-else-if="isInjury">
            {{ rollData.characterName }} rolled
            <span class="skill-name">Injury</span>
        </span>

        <span v-else>
            {{ rollData.characterName }} rolled
            <span class="skill-name">{{ rollData.baseSkillName || rollData.skillName }}</span>
            <span v-if="rollData.favoredStatus" :class="{
                'favored-modifier': rollData.favoredStatus === 'favored',
                'ill-favored-modifier': rollData.favoredStatus === 'ill-favored',
            }">
                ({{ rollData.favoredStatus }})
            </span>
        </span>
    </div>
</template>

<script setup>
defineProps({
    rollData: {
        type: Object,
        required: true
    },
    isEngagement: {
        type: Boolean,
        required: true
    },
    isOpposedSkillCheck: {
        type: Boolean,
        required: true
    },
    isCustomRoll: {
        type: Boolean,
        required: true
    },
    isInitiative: {
        type: Boolean,
        default: false
    },
    isInjury: {
        type: Boolean,
        default: false
    }
})
</script>

<style scoped>
.roll-title {
    font-size: var(--font-size-14);
    text-align: center;
}

.skill-name {
    color: var(--color-accent-gold);
    font-weight: var(--font-weight-bold);
}

.favored-modifier {
    color: var(--color-success);
    font-weight: var(--font-weight-bold);
}

.ill-favored-modifier {
    color: var(--color-danger);
    font-weight: var(--font-weight-bold);
    margin-left: var(--space-xs);
}
</style>
