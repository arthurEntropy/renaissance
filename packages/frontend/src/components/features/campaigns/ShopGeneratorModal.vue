<template>
    <BaseModal title="Shop Generator" :open="open" width="min(680px, 94vw)" @close="emit('close')">
        <div class="generator-form">
            <div class="form-field">
                <label class="form-label">Shop Name</label>
                <input v-model="shopName" class="form-input" type="text" :placeholder="shopNamePlaceholder" />
            </div>

            <div class="form-field">
                <p class="mix-section-label">Culture Mix</p>
                <div class="keeping-mix">
                    <div v-for="culture in shopCultures" :key="culture.id" class="keeping-row">
                        <span class="keeping-name">{{ culture.name }}</span>
                        <input v-model.number="cultureMix[culture.id]" type="range" min="0" max="10"
                            class="keeping-slider" />
                        <span class="keeping-value">{{ cultureMix[culture.id] ?? 5 }}</span>
                    </div>
                    <p v-if="shopCultures.length === 0" class="empty-hint">No cultures available.</p>
                </div>
            </div>

            <div class="form-field">
                <p class="mix-section-label">Keeping Mix</p>
                <div class="keeping-mix">
                    <div v-for="tier in standardTiers" :key="tier.id" class="keeping-row">
                        <span class="keeping-name">{{ tier.name }}</span>
                        <input v-model.number="keepingMix[tier.id]" type="range" min="0" max="10"
                            class="keeping-slider" />
                        <span class="keeping-value">{{ keepingMix[tier.id] ?? 5 }}</span>
                    </div>
                </div>
            </div>

            <div v-if="rareTiers.length > 0" class="form-field">
                <p class="mix-section-label">Rare Items</p>
                <div class="keeping-mix">
                    <div v-for="tier in rareTiers" :key="tier.id" class="keeping-row">
                        <span class="keeping-name">{{ tier.name }}</span>
                        <input v-model.number="keepingMix[tier.id]" type="range" min="0" max="10"
                            class="keeping-slider" />
                        <span class="keeping-value">{{ keepingMix[tier.id] ?? 0 }}</span>
                    </div>
                </div>
            </div>

            <div class="form-field">
                <p class="mix-section-label">Item Count ({{ itemCount }})</p>
                <input v-model.number="itemCount" type="range" min="5" max="50" class="keeping-slider full-width" />
            </div>

            <div class="form-field form-field--checkbox">
                <label class="checkbox-label">
                    <input v-model="isVisibleToPlayers" type="checkbox" class="form-checkbox" />
                    Visible to players when created
                </label>
            </div>
        </div>

        <template #actions>
            <ActionButton variant="neutral" @click="emit('close')">Cancel</ActionButton>
            <ActionButton variant="neutral" :disabled="shopSaving" @click="stockManually">
                {{ shopSaving ? 'Creating…' : 'Stock Manually' }}
            </ActionButton>
            <ActionButton variant="primary" :disabled="shopGenerating" @click="generateAndSave">
                {{ shopGenerating ? 'Generating…' : 'Generate' }}
            </ActionButton>
        </template>
    </BaseModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useCampaignStore } from '@/stores/campaignStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useKeepingStore } from '@/stores/keepingStore'
import CampaignService from '@/services/entities/campaignService'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const props = defineProps({
    open: { type: Boolean, default: false },
    campaignId: { type: String, required: true },
})

const emit = defineEmits(['close'])

const campaignStore = useCampaignStore()
const conceptsStore = useConceptsStore()
const keepingStore = useKeepingStore()

// Data sources
const shopCultures = computed(() => conceptsStore.visibleCultures)
const allKeepingTiers = computed(() => keepingStore.keeping || [])

// Split into standard (cost <= 4) and rare (cost > 4)
const standardTiers = computed(() => allKeepingTiers.value.filter((t) => t.cost <= 4))
const rareTiers = computed(() => allKeepingTiers.value.filter((t) => t.cost > 4))
const rareTierIdSet = computed(() => new Set(rareTiers.value.map((t) => t.id)))

// Form state
const shopName = ref('')
const itemCount = ref(12)
const cultureMix = ref({})
const keepingMix = ref({})
const isVisibleToPlayers = ref(true)

const shopGenerating = ref(false)
const shopSaving = ref(false)

const SHOP_NAME_PLACEHOLDERS = [
    'Knightley, Dwarven Bow Exchanger',
    'Clarissa Sells It All',
    'The Secret World of Alex Macguffin',
    'Legends of the Hidden Templar',
    'Salute Your Swords',
    'Kenan & Spell',
    'Tierney\'s Magic Nifty Trinkets',
]

const shopNamePlaceholder = ref(SHOP_NAME_PLACEHOLDERS[0])

function pickRandomShopNamePlaceholder() {
    const index = Math.floor(Math.random() * SHOP_NAME_PLACEHOLDERS.length)
    return SHOP_NAME_PLACEHOLDERS[index]
}

// Initialize slider values when the modal opens or when the data loads
function initSliderDefaults() {
    const newCultureMix = {}
    for (const culture of shopCultures.value) {
        newCultureMix[culture.id] = cultureMix.value[culture.id] ?? 5
    }
    cultureMix.value = newCultureMix

    const newKeepingMix = {}
    for (const tier of allKeepingTiers.value) {
        const defaultVal = tier.cost > 4 ? 0 : 5
        newKeepingMix[tier.id] = keepingMix.value[tier.id] ?? defaultVal
    }
    keepingMix.value = newKeepingMix
}

watch(() => props.open, (isOpen) => {
    if (!isOpen) return
    shopName.value = ''
    shopNamePlaceholder.value = pickRandomShopNamePlaceholder()
    itemCount.value = 12
    isVisibleToPlayers.value = true
    initSliderDefaults()
}, { immediate: true })

// Also re-init if culture/keeping data loads after the modal opens
watch([shopCultures, allKeepingTiers], () => {
    if (props.open) initSliderDefaults()
})

// Helpers
const buildMixArrays = () => {
    const rawCultureMix = shopCultures.value
        .map((c) => ({ cultureId: c.id, weight: cultureMix.value[c.id] ?? 5 }))
        .filter((c) => c.weight > 0)

    const cultureMixPayload = rawCultureMix.length > 0
        ? rawCultureMix
        : shopCultures.value.map((c) => ({ cultureId: c.id, weight: 1 }))

    const rawKeepingMix = allKeepingTiers.value
        .map((t) => ({ keepingId: t.id, weight: keepingMix.value[t.id] ?? (t.cost > 4 ? 0 : 5) }))
        .filter((t) => t.weight > 0)

    const keepingMixPayload = rawKeepingMix.length > 0
        ? rawKeepingMix
        : standardTiers.value.map((t) => ({ keepingId: t.id, weight: 1 }))

    const rareTierIds = keepingMixPayload
        .filter((t) => rareTierIdSet.value.has(t.keepingId))
        .map((t) => t.keepingId)

    return { cultureMixPayload, keepingMixPayload, rareTierIds }
}

const generateAndSave = async () => {
    shopGenerating.value = true
    try {
        const { cultureMixPayload, keepingMixPayload, rareTierIds } = buildMixArrays()
        const generated = await CampaignService.generateShop(props.campaignId, {
            cultureMix: cultureMixPayload,
            keepingMix: keepingMixPayload,
            rareTierIds,
            itemCount: itemCount.value,
        })
        await campaignStore.saveShop(props.campaignId, {
            ...generated,
            name: shopName.value.trim() || generated.name || 'New Shop',
            isVisibleToPlayers: isVisibleToPlayers.value,
        })
        emit('close')
    } catch (error) {
        console.error('Shop generation failed:', error)
    } finally {
        shopGenerating.value = false
    }
}

const stockManually = async () => {
    shopSaving.value = true
    try {
        await campaignStore.saveShop(props.campaignId, {
            name: shopName.value.trim() || 'New Shop',
            isVisibleToPlayers: isVisibleToPlayers.value,
            items: [],
        })
        emit('close')
    } catch (error) {
        console.error('Failed to create shop:', error)
    } finally {
        shopSaving.value = false
    }
}


</script>

<style scoped>
.generator-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding-bottom: var(--space-md);
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.form-input {
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-14);
    padding: var(--space-sm) var(--space-md);
    outline: none;
    transition: border-color var(--transition-fast);
}

.form-input:focus {
    border-color: var(--color-primary);
}

.mix-section-label {
    font-size: var(--font-size-12);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-accent-cyan);
    margin: 0 0 var(--space-xs);
}

.keeping-mix {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.keeping-row {
    display: flex;
    align-items: center;
    gap: var(--space-md);
}

.keeping-name {
    font-size: var(--font-size-13);
    color: var(--color-text-secondary);
    width: 130px;
    flex-shrink: 0;
}

.keeping-slider {
    flex: 1;
    accent-color: var(--color-primary);
}

.keeping-slider.full-width {
    width: 100%;
}

.keeping-value {
    font-size: var(--font-size-13);
    color: var(--color-text-primary);
    width: 20px;
    text-align: right;
    flex-shrink: 0;
}

.empty-hint {
    font-size: var(--font-size-13);
    color: var(--color-text-muted);
    font-style: italic;
    margin: 0;
}

.form-field--checkbox {
    flex-direction: row;
    align-items: center;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: var(--font-size-14);
    color: var(--color-text-secondary);
    cursor: pointer;
    user-select: none;
}

.form-checkbox {
    width: 16px;
    height: 16px;
    accent-color: var(--color-primary);
    cursor: pointer;
    flex-shrink: 0;
}
</style>
