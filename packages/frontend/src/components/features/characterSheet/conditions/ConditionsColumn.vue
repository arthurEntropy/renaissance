<template>
    <div class="conditions-column-container">
        <CharacterSheetSection custom-class="conditions-column">
            <div class="conditions-header">Conditions</div>
            <div class="conditions-row" v-for="(value, key) in character.conditions" :key="key">
                <span :class="{ 'condition-active': value }">{{
                    capitalize(key)
                    }}</span>
                <input type="checkbox" class="skill-checkbox" :class="{ 'condition-active-checkbox': value }"
                    :checked="value" :disabled="!isEditMode" @change="updateCondition(key, $event.target.checked)" />
            </div>
        </CharacterSheetSection>

        <CharacterSheetSection custom-class="speed-column">
            <div class="speed-row">
                <span class="speed-name">Speed</span>
                <NumberInput :model-value="character.speed || 0" :disabled="!isEditMode"
                    @update:model-value="updateSpeed" :min="0" size="small" />
            </div>
        </CharacterSheetSection>
    </div>
</template>

<script setup>
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import CharacterService from '@/services/entities/characterService'

const props = defineProps({
    character: {
        type: Object,
        required: true
    },
    isEditMode: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:character'])

const capitalize = (s) => {
    const str = String(s || '')
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const updateCondition = (conditionKey, value) => {
    const updatedCharacter = {
        ...props.character,
        conditions: {
            ...props.character.conditions,
            [conditionKey]: value
        }
    }
    CharacterService.updateDiceMods(updatedCharacter)
    CharacterService.updateFavoredStatus(updatedCharacter)
    emit('update:character', updatedCharacter)
}

const updateSpeed = (value) => {
    const updatedCharacter = {
        ...props.character,
        speed: value
    }
    emit('update:character', updatedCharacter)
}
</script>

<style scoped>
.conditions-column-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
}

.conditions-column {
    align-items: center;
    width: 100px;
    padding-bottom: 44px;
}

.speed-column {
    align-items: center;
    width: 100px;
}

@media (max-width: var(--breakpoint-sm)) {
    .conditions-column {
        margin: 0 calc(var(--space-xl) * 2);
    }

    .speed-column {
        margin: var(--space-md) calc(var(--space-xl) * 2) 0;
    }
}

.conditions-header {
    display: flex;
    align-items: end;
    margin: 4px 0;
    font-size: var(--font-size-14);
    font-style: italic;
    height: 28px;
}

.conditions-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin: var(--space-xs) 0;
    height: 25px;
    border-bottom: 1px solid var(--color-gray-dark);
}

.speed-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 25px;
}

.speed-name {
    font-size: var(--font-size-14);
}

.condition-active {
    color: var(--color-danger);
    text-shadow: var(--shadow-glow-sm-danger);
}

.condition-active-checkbox {
    box-shadow: var(--shadow-glow-danger-md);
}
</style>
