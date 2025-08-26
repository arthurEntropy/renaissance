<template>
    <div class="conditions-column-container">
        <CharacterSheetSection custom-class="conditions-column">
            <div class="conditions-header">Conditions</div>
            <div class="conditions-row" v-for="(value, key) in character.conditions" :key="key">
                <span :class="{ 'condition-active': value }">{{
                    capitalize(key)
                    }}</span>
                <input type="checkbox" class="skill-checkbox" :class="{ 'condition-active-checkbox': value }"
                    :checked="value" @change="updateCondition(key, $event.target.checked)" />
            </div>
            <div class="conditions-row" style="border-bottom: none"></div>
        </CharacterSheetSection>
    </div>
</template>

<script setup>
import { capitalizeFirstLetter } from '@shared/utils/stringUtils'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import CharacterService from '@/services/characterService'

const props = defineProps({
    character: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['update:character'])

const capitalize = (s) => capitalizeFirstLetter(String(s || ''))

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
</script>

<style scoped>
.conditions-column-container {
    display: flex;
    flex-direction: column;
}

.conditions-column {
    align-items: center;
    width: 100px;
}

@media (max-width: var(--breakpoint-sm)) {
    .conditions-column {
        margin: 0 calc(var(--space-xl) * 2);
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

.condition-active {
    color: var(--color-danger);
    text-shadow: var(--shadow-glow-sm-danger);
}

.condition-active-checkbox {
    box-shadow: var(--shadow-glow-danger-md);
}
</style>
