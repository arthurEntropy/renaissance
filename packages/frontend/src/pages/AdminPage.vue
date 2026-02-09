<template>
    <div class="admin-page">
        <UserSettings />

        <UserManager />

        <AdminListManager title="Background Images" item-name="Background" :store="backgroundImagesStore"
            :default-item="{ imageUrl: '', index: 0 }">
            <template #fields="{ item, update }">
                <input v-model="item.imageUrl" @blur="update" class="url-input" placeholder="Image URL" />
                <img v-if="item.imageUrl" :src="item.imageUrl" class="preview" alt="Background preview" />
            </template>
        </AdminListManager>

        <AdminListManager title="Expansions" item-name="Expansion" :store="expansionsStore"
            :default-item="{ name: '', logoUrl: '', index: 0 }">
            <template #fields="{ item, update }">
                <input v-model="item.name" @blur="update" class="name-input" placeholder="Expansion Name" />
                <input v-model="item.logoUrl" @blur="update" class="logo-input" placeholder="Logo URL" />
                <img v-if="item.logoUrl" :src="item.logoUrl" class="logo-preview" alt="Logo preview" />
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
    </div>
</template>

<script setup>
import AdminListManager from '@/components/features/admin/AdminListManager.vue'
import UserManager from '@/components/features/admin/UserManager.vue'
import UserSettings from '@/components/features/admin/UserSettings.vue'
import { useBackgroundImagesStore } from '@/stores/backgroundImagesStore'
import { useExpansionsStore } from '@/stores/expansionsStore'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import { useEquipmentRangesStore } from '@/stores/equipmentRangesStore'
import { useEngagementSuccessesStore } from '@/stores/engagementSuccessesStore'

const backgroundImagesStore = useBackgroundImagesStore()
const expansionsStore = useExpansionsStore()
const equipmentTypesStore = useEquipmentTypesStore()
const equipmentSubtypesStore = useEquipmentSubtypesStore()
const equipmentGradesStore = useEquipmentGradesStore()
const equipmentRangesStore = useEquipmentRangesStore()
const engagementSuccessesStore = useEngagementSuccessesStore()
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
</style>