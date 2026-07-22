<template>
    <div class="admin-page">
        <UserSettings />

        <UserManager />

        <AdminCleanupPanel />

        <AdminListManager title="Expansions" item-name="Expansion" :store="expansionsStore"
            :default-item="{ name: '', logoUrl: '', isAdminVisible: true, isPublic: false, index: 0 }">
            <template #fields="{ item, update }">
                <div class="expansion-admin-fields">
                    <div class="expansion-top-row">
                        <input v-model="item.name" @blur="update" class="name-input" placeholder="Expansion Name" />
                        <input v-model="item.logoUrl" @blur="update" class="logo-input" placeholder="Logo URL" />
                        <img v-if="item.logoUrl" :src="item.logoUrl" class="logo-preview" alt="Logo preview" />
                    </div>
                    <div class="expansion-visibility-row">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="item.isAdminVisible" @change="update" />
                            Admin visible
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="item.isPublic" @change="update" />
                            Public
                        </label>
                    </div>
                </div>
            </template>
        </AdminListManager>

        <AdminListManager title="Equipment Types" item-name="Type" :store="equipmentTypesStore"
            :default-item="{ name: '', description: '', index: 0 }">
            <template #fields="{ item, update }">
                <input v-model="item.name" @blur="update" class="field-input" placeholder="Type Name" />
                <input v-model="item.description" @blur="update" class="field-input flex-1" placeholder="Description" />
            </template>
        </AdminListManager>

        <AdminListManager title="Equipment Subtypes" item-name="Subtype" :store="equipmentSubtypesStore"
            :group-by-store="equipmentTypesStore" group-by-key="typeId"
            :default-item="{ name: '', description: '', typeId: null, index: 0 }">
            <template #fields="{ item, update }">
                <input v-model="item.name" @blur="update" class="field-input" placeholder="Subtype Name" />
                <input v-model="item.description" @blur="update" class="field-input flex-1" placeholder="Description" />
            </template>
        </AdminListManager>

        <AdminListManager title="Equipment Grades" item-name="Grade" :store="equipmentGradesStore"
            :default-item="{ name: '', description: '', index: 0 }">
            <template #fields="{ item, update }">
                <input v-model="item.name" @blur="update" class="field-input" placeholder="Grade Name" />
                <input v-model="item.description" @blur="update" class="field-input flex-1" placeholder="Description" />
            </template>
        </AdminListManager>

        <AdminListManager title="Equipment Ranges" item-name="Range" :store="equipmentRangesStore"
            :default-item="{ name: '', distance: '', index: 0 }">
            <template #fields="{ item, update }">
                <input v-model="item.name" @blur="update" class="field-input" placeholder="Range Name" />
                <input v-model="item.distance" @blur="update" class="field-input flex-1" placeholder="Distance" />
            </template>
        </AdminListManager>

        <AdminListManager title="Engagement Successes" item-name="Success" :store="engagementSuccessesStore"
            :default-item="{ name: '', description: '', index: 0 }">
            <template #fields="{ item, update }">
                <input v-model="item.name" @blur="update" class="field-input" placeholder="Success Name" />
                <input v-model="item.description" @blur="update" class="field-input flex-1" placeholder="Description" />
            </template>
        </AdminListManager>

        <AdminListManager title="Beast Types" item-name="Beast Type" :store="beastTypesStore"
            :default-item="{ name: '', description: '', artUrl: '', index: 0 }">
            <template #fields="{ item, update }">
                <input v-model="item.name" @blur="update" class="field-input" placeholder="Type Name" />
                <input v-model="item.description" @blur="update" class="field-input flex-1" placeholder="Description" />
            </template>
        </AdminListManager>

        <AdminListManager title="Biomes" item-name="Biome" :store="biomesStore"
            :default-item="{ name: '', description: '', artUrl: '', tags: [], index: 0 }">
            <template #fields="{ item, update }">
                <div class="biome-admin-fields">
                    <input v-model="item.name" @blur="update" class="field-input" placeholder="Name" />
                    <input v-model="item.description" @blur="update" class="field-input" placeholder="Description" />
                    <div class="biome-art-row">
                        <input v-model="item.artUrl" @blur="update" class="url-input" placeholder="Art URL" />
                        <img v-if="item.artUrl" :src="item.artUrl" class="biome-art-preview" alt="Biome art preview" />
                    </div>
                    <BiomeTagsCyclePicker :augment-tags="item.tags" :inhibit-tags="[]"
                        @update:augment-tags="(tags) => { item.tags = tags; update() }" />
                </div>
            </template>
        </AdminListManager>

        <AdminListManager title="Ability Schools" item-name="School" :store="abilitySchoolsStore"
            :group-by-store="mestriereGroupStore" group-by-key="sourceId"
            :default-item="{ name: '', description: '', color: '', sourceId: null, index: 0 }">
            <template #fields="{ item, update }">
                <input v-model="item.name" @blur="update" class="field-input" placeholder="School Name" />
                <input v-model="item.description" @blur="update" class="field-input flex-1" placeholder="Description" />
                <input type="color" v-model="item.color" @change="update" class="school-color-input"
                    title="Badge color" />
            </template>
        </AdminListManager>

        <AdminListManager title="Keeping" item-name="Keeping" :store="keepingStore"
            :default-item="{ name: '', description: '', cost: 0, imageUrl: '', gratuiti: '', isEquipmentOnly: false, index: 0 }">
            <template #fields="{ item, update }">
                <div class="keeping-admin-fields">
                    <div class="keeping-top-row">
                        <input v-model="item.name" @blur="update" class="field-input" placeholder="Keeping Name" />
                        <input v-model.number="item.cost" @blur="update" type="number" min="0"
                            class="field-input cost-input" placeholder="Cost" />
                        <input v-model="item.imageUrl" @blur="update" class="field-input flex-1"
                            placeholder="Image URL" />
                        <img v-if="item.imageUrl" :src="item.imageUrl" class="keeping-art-preview"
                            alt="Keeping image preview" />
                    </div>
                    <textarea v-model="item.description" @blur="update" class="field-input" placeholder="Description" />
                    <textarea v-model="item.gratuiti" @blur="update" class="field-input gratuiti-input"
                        placeholder="Gratuiti" rows="2" />
                    <label class="checkbox-label">
                        <input type="checkbox" v-model="item.isEquipmentOnly" @change="update" />
                        Equipment only (rarity tier, not a character keeping level)
                    </label>
                </div>
            </template>
        </AdminListManager>

        <AdminListManager title="Art Placeholders" item-name="Placeholder" :store="artPlaceholdersStore"
            :delete-confirm-message="() => 'Delete this placeholder image?'" :default-item="{ url: '', index: 0 }">
            <template #fields="{ item, update }">
                <div class="placeholder-admin-fields">
                    <input v-model="item.url" @blur="update" class="field-input flex-1" placeholder="Image URL" />
                    <img v-if="item.url" :src="item.url" class="placeholder-preview" alt="Placeholder preview" />
                </div>
            </template>
        </AdminListManager>

        <AdminReportingPanel />
    </div>
</template>

<script setup>
import AdminListManager from '@/components/features/admin/AdminListManager.vue'
import AdminCleanupPanel from '@/components/features/admin/AdminCleanupPanel.vue'
import AdminReportingPanel from '@/components/features/admin/AdminReportingPanel.vue'
import UserManager from '@/components/features/admin/UserManager.vue'
import UserSettings from '@/components/features/admin/UserSettings.vue'
import { useExpansionsStore } from '@/stores/expansionsStore'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import { useEquipmentRangesStore } from '@/stores/equipmentRangesStore'
import { useEngagementSuccessesStore } from '@/stores/engagementSuccessesStore'
import { useBiomesStore } from '@/stores/biomesStore'
import { useBeastTypesStore } from '@/stores/beastTypesStore'
import { useAbilitySchoolsStore } from '@/stores/abilitySchoolsStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { useArtPlaceholdersStore } from '@/stores/artPlaceholdersStore'
import { computed } from 'vue'
import BiomeTagsCyclePicker from '@/components/ui/biome/BiomeTagsCyclePicker.vue'

const expansionsStore = useExpansionsStore()
const equipmentTypesStore = useEquipmentTypesStore()
const equipmentSubtypesStore = useEquipmentSubtypesStore()
const equipmentGradesStore = useEquipmentGradesStore()
const equipmentRangesStore = useEquipmentRangesStore()
const engagementSuccessesStore = useEngagementSuccessesStore()
const biomesStore = useBiomesStore()
const beastTypesStore = useBeastTypesStore()
const abilitySchoolsStore = useAbilitySchoolsStore()
const conceptsStore = useConceptsStore()
const keepingStore = useKeepingStore()
const artPlaceholdersStore = useArtPlaceholdersStore()

// Group ability schools by mestiere; expose as a store-shaped object for AdminListManager.
// computed() is required so that changes to conceptsStore.mestieri propagate reactively as a prop.
const mestriereGroupStore = computed(() => ({
    items: conceptsStore.mestieri,
    fetch: conceptsStore.fetch,
}))
</script>

<style scoped>
.admin-page {
    min-width: 700px;
    max-width: 700px;
    margin: var(--space-xl);
    padding: var(--space-xl);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
}

.expansion-admin-fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    flex: 1;
    min-width: 0;
}

.expansion-top-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.expansion-visibility-row {
    display: flex;
    align-items: center;
    gap: var(--space-md);
}

.biome-admin-fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    flex: 1;
    min-width: 0;
}

.biome-admin-fields .field-input,
.biome-admin-fields .url-input {
    width: 100%;
    min-width: 0;
}

.biome-art-row {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.biome-art-preview {
    width: 180px;
    height: 90px;
    object-fit: cover;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
    flex-shrink: 0;
}

.school-color-input {
    width: 36px;
    height: 28px;
    padding: 2px;
    border: 1px solid var(--color-gray-medium);
    border-radius: var(--radius-5);
    background: none;
    cursor: pointer;
    flex-shrink: 0;
}

.keeping-admin-fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    flex: 1;
    min-width: 0;
}

.keeping-admin-fields .field-input {
    width: 100%;
    min-width: 0;
}

.keeping-top-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.keeping-top-row .field-input {
    width: auto;
}

.keeping-art-preview {
    width: 80px;
    height: 50px;
    object-fit: cover;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
    flex-shrink: 0;
}

.cost-input {
    max-width: 70px;
}

.gratuiti-input {
    resize: vertical;
}

.placeholder-admin-fields {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex: 1;
    min-width: 0;
}

.placeholder-preview {
    width: 80px;
    height: 50px;
    object-fit: cover;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-gray-medium);
    flex-shrink: 0;
}
</style>