<template>
    <CharacterSheetSection>
        <!-- Section Header -->
        <TableHeader title="Biome" :show-edit-button="false" collapsible :is-collapsed="isCollapsed"
            @toggle-collapse="isCollapsed = !isCollapsed">
            <template #header-right>
                <FloatingActionButton v-if="hasActiveTags" :type="FAB_TYPES.REFRESH" :size="FAB_SIZES.SMALL"
                    :visibility="FAB_VISIBILITIES.ALWAYS" title="Clear active biome tags"
                    @click="biomeStore.clearAll()" />
            </template>
        </TableHeader>

        <!-- All three groups in one horizontal row -->
        <div v-if="!isCollapsed" class="biome-row">
            <!-- Biome preset picker -->
            <BiomePicker />

            <template v-for="(group, idx) in BIOME_TAG_GROUPS_ORDERED" :key="group.label">
                <!-- Gradient divider between groups -->
                <div v-if="idx > 0" class="group-divider" />

                <div class="biome-group" :class="{ 'biome-group-terrain': group.groupKey === BiomeTagGroup.TERRAIN }">
                    <span class="biome-group-label">{{ group.label }}</span>
                    <div class="biome-group-tags">
                        <button v-for="tag in group.tags" :key="tag" type="button" class="biome-tag-btn"
                            :class="{ active: biomeStore.isTagActive(tag) }" :title="tagTitle(tag)"
                            @click="biomeStore.toggleTag(tag)">
                            <BiomeTagSymbol :tag="tag" :active="biomeStore.isTagActive(tag)" />
                            <span class="biome-tag-label">{{ BIOME_TAG_LABELS[tag] }}</span>
                        </button>
                    </div>
                </div>
            </template>
        </div>
    </CharacterSheetSection>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useBiomeStore } from '@/stores/biomeStore'
import { useBiomesStore } from '@/stores/biomesStore'
import { BiomeTagGroup, BIOME_TAG_GROUPS, BIOME_TAG_GROUP_LABELS, BIOME_TAG_LABELS } from '@shared/constants/biomeTags'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import BiomeTagSymbol from '@/components/ui/biome/BiomeTagSymbol.vue'
import BiomePicker from './BiomePicker.vue'

const biomeStore = useBiomeStore()
const biomesStore = useBiomesStore()
const isCollapsed = ref(false)

onMounted(() => {
    biomesStore.fetch()
})

const BIOME_TAG_GROUPS_ORDERED = Object.values(BiomeTagGroup).map(group => ({
    groupKey: group,
    label: BIOME_TAG_GROUP_LABELS[group],
    tags: BIOME_TAG_GROUPS[group],
}))

const hasActiveTags = computed(() => biomeStore.activeTags.size > 0)

function tagTitle(tag) {
    return biomeStore.isTagActive(tag)
        ? `${BIOME_TAG_LABELS[tag]}: active (click to deactivate)`
        : `${BIOME_TAG_LABELS[tag]}: inactive (click to activate)`
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.biome-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: center;
    gap: var(--space-md);
    width: 100%;
    padding-top: var(--space-sm);
    flex-wrap: wrap;
}

.group-divider {
    width: 1px;
    align-self: stretch;
    flex-shrink: 0;
    background: linear-gradient(to bottom,
            transparent,
            var(--color-border-primary) 20%,
            var(--color-border-primary) 80%,
            transparent);
}

.biome-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    flex: 1 1 0;
    min-width: 0;
}

.biome-group-terrain {
    flex: 1.5 1 0;
}

.biome-group-label {
    font-size: var(--font-size-10);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.biome-group-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-xs);
}

.biome-tag-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--overlay-white-subtle);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-5);
    padding: 2px var(--space-xs);
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: var(--font-size-12);
    transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.biome-tag-btn:hover {
    background: var(--overlay-white-medium);
    color: var(--color-text-primary);
}

.biome-tag-btn.active {
    background: var(--overlay-white-medium);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.biome-tag-label {
    line-height: 1;
}
</style>
