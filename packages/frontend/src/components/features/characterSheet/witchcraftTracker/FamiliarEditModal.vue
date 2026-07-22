<template>
    <BaseModal title="Choose Familiar" width="420px" @close="emit('close')">
        <div class="familiar-modal-body">
            <p class="familiar-modal-hint">
                Choose a creature with a Challenge of 0 to bond with as your familiar. A personal copy will be created
                for you.
            </p>

            <div v-if="eligibleBeasts.length === 0" class="familiar-modal-empty">
                No eligible creatures found (Challenge 0).
            </div>

            <div v-else class="beast-list">
                <button v-for="beast in eligibleBeasts" :key="beast.id" type="button" class="beast-row"
                    :class="{ 'beast-row--selected': selectedBeastId === beast.id }"
                    @click="selectedBeastId = beast.id">
                    <div class="beast-row__art">
                        <img v-if="beast.featuredArtUrls?.[0]" :src="beast.featuredArtUrls[0]" class="beast-row__img"
                            alt="" />
                        <SparklesIcon v-else class="beast-row__placeholder-icon" />
                    </div>
                    <span class="beast-row__name">{{ beast.name }}</span>
                    <CheckCircleIcon v-if="selectedBeastId === beast.id" class="beast-row__check" />
                </button>
            </div>
        </div>

        <template #actions>
            <ActionButton variant="neutral" size="large" text="Cancel" @click="emit('close')" type="button" />
            <ActionButton variant="primary" size="large" text="Choose" :disabled="!selectedBeastId || isSaving"
                @click="handleChoose" />
        </template>
    </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { SparklesIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAuthStore } from '@/stores/authStore'
import { createDefaultPlayerCharacter } from '@shared/types/character'

const emit = defineEmits(['close', 'chosen'])

const charactersStore = useCharactersStore()
const authStore = useAuthStore()

const selectedBeastId = ref(null)
const isSaving = ref(false)

const eligibleBeasts = computed(() =>
    charactersStore.filteredBeasts.filter(b => (b.challenge ?? 0) === 0)
        .slice().sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
)

async function handleChoose() {
    if (!selectedBeastId.value || isSaving.value) return

    const beast = eligibleBeasts.value.find(b => b.id === selectedBeastId.value)
    if (!beast) return

    const confirmed = window.confirm(`Choose "${beast.name}" as your familiar? A personal copy will be created.`)
    if (!confirmed) return

    isSaving.value = true
    try {
        // Build a playerCharacter copy from the beast template, copying over stats and appearance
        const familiar = {
            ...createDefaultPlayerCharacter(),
            characterType: 'playerCharacter',
            ownerId: authStore.user?.uid ?? null,
            name: beast.name,
            featuredArtUrls: beast.featuredArtUrls ? [...beast.featuredArtUrls] : [],
            speed: beast.speed ?? 0,
            body: beast.body ?? 0,
            heart: beast.heart ?? 0,
            wits: beast.wits ?? 0,
            skills: beast.skills ? beast.skills.map(s => ({ ...s })) : undefined,
            abilities: beast.abilities ? beast.abilities.map(a => ({ ...a })) : [],
            endurance: beast.endurance ? { ...beast.endurance } : { current: 0, base: 0 },
            hope: beast.hope ? { ...beast.hope } : { current: 0, base: 0 },
            defense: beast.defense ? { ...beast.defense } : { current: 0, base: 0 },
            notes: beast.notes ?? '',
        }

        const created = await charactersStore.create(familiar)
        emit('chosen', created.id)
    } finally {
        isSaving.value = false
    }
}
</script>

<style scoped>
.familiar-modal-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.familiar-modal-hint {
    font-size: var(--font-size-13);
    color: var(--color-text-muted);
    font-style: italic;
    margin: 0;
}

.familiar-modal-empty {
    font-size: var(--font-size-14);
    color: var(--color-text-muted);
    font-style: italic;
    padding: var(--space-lg) 0;
    text-align: center;
}

.beast-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    max-height: 320px;
    overflow-y: auto;
}

.beast-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-5);
    cursor: pointer;
    text-align: left;
    transition: border-color var(--transition-fast), background var(--transition-fast);
    font-family: inherit;
    color: var(--color-text-primary);
}

.beast-row:hover {
    background: var(--overlay-white-subtle);
    border-color: var(--color-accent-purple, #a855f7);
}

.beast-row--selected {
    border-color: var(--color-accent-purple, #a855f7);
    background: var(--overlay-white-subtle);
}

.beast-row__art {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: var(--radius-5);
    overflow: hidden;
    background: var(--color-bg-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
}

.beast-row__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.beast-row__placeholder-icon {
    width: 20px;
    height: 20px;
    color: var(--color-text-muted);
}

.beast-row__name {
    flex: 1;
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-medium);
}

.beast-row__check {
    width: 18px;
    height: 18px;
    color: var(--color-accent-purple, #a855f7);
    flex-shrink: 0;
}
</style>
