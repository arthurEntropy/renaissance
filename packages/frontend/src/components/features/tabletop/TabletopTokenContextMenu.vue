<template>
    <CascadeMenuFrame :anchor-position="anchorPosition" anchor-mode="anchorY" :close-on-outside-click="true"
        @close="$emit('close')">
        <div class="token-context-menu">
            <div class="cascade-col">
                <!-- Roll… section header -->
                <div class="cascade-section-label">Roll…</div>

                <!-- Initiative -->
                <div class="cascade-item-wrap cascade-item-wrap--leaf" @click="onRollClick({ type: 'initiative' })">
                    <button class="cascade-btn cascade-btn--leaf" tabindex="-1">
                        <span class="cascade-btn-label">Initiative</span>
                    </button>
                </div>

                <!-- Injury -->
                <div class="cascade-item-wrap cascade-item-wrap--leaf" @click="onRollClick({ type: 'injury' })">
                    <button class="cascade-btn cascade-btn--leaf" tabindex="-1">
                        <span class="cascade-btn-label">Injury</span>
                    </button>
                </div>

                <!-- BODY skills -->
                <div class="cascade-col-divider" />
                <div class="cascade-section-label">BODY</div>
                <div v-for="skill in bodySkills" :key="skill.key" class="cascade-item-wrap cascade-item-wrap--leaf"
                    @click="onRollClick({ type: 'skill', skillKey: skill.key })">
                    <button class="cascade-btn cascade-btn--leaf" tabindex="-1">
                        <span class="cascade-btn-label">{{ skill.label }}</span>
                    </button>
                </div>

                <!-- HEART skills -->
                <div class="cascade-col-divider" />
                <div class="cascade-section-label">HEART</div>
                <div v-for="skill in heartSkills" :key="skill.key" class="cascade-item-wrap cascade-item-wrap--leaf"
                    @click="onRollClick({ type: 'skill', skillKey: skill.key })">
                    <button class="cascade-btn cascade-btn--leaf" tabindex="-1">
                        <span class="cascade-btn-label">{{ skill.label }}</span>
                    </button>
                </div>

                <!-- WITS skills -->
                <div class="cascade-col-divider" />
                <div class="cascade-section-label">WITS</div>
                <div v-for="skill in witsSkills" :key="skill.key" class="cascade-item-wrap cascade-item-wrap--leaf"
                    @click="onRollClick({ type: 'skill', skillKey: skill.key })">
                    <button class="cascade-btn cascade-btn--leaf" tabindex="-1">
                        <span class="cascade-btn-label">{{ skill.label }}</span>
                    </button>
                </div>
            </div>
        </div>
    </CascadeMenuFrame>
</template>

<script setup>
import { computed } from 'vue'
import CascadeMenuFrame from '@/components/ui/pickers/CascadeMenuFrame.vue'
import { SKILLS, CORE_ABILITIES } from '@shared/constants/characterConstants'

const props = defineProps({
    anchorPosition: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['roll', 'close'])

const bodySkills = computed(() =>
    Object.values(SKILLS).filter(s => s.coreAbility.key === CORE_ABILITIES.BODY.key)
)
const heartSkills = computed(() =>
    Object.values(SKILLS).filter(s => s.coreAbility.key === CORE_ABILITIES.HEART.key)
)
const witsSkills = computed(() =>
    Object.values(SKILLS).filter(s => s.coreAbility.key === CORE_ABILITIES.WITS.key)
)

function onRollClick(spec) {
    emit('roll', spec)
    emit('close')
}
</script>

<style scoped>
@import '@/styles/cascade-picker.css';

.token-context-menu {
    display: flex;
}

.cascade-col {
    width: 160px;
}
</style>
