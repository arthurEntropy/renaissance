<template>
    <CollapsibleAdminSection title="Data Sync">
        <div class="data-sync-panel">
            <p class="data-sync-description">
                Download all server data as a <code>.tar.gz</code> archive (e.g. to sync back to the repo), or upload
                an archive to replace all server data.
            </p>

            <div class="data-sync-row">
                <ActionButton variant="primary" :text="isDownloading ? 'Downloading...' : 'Download Data Archive'"
                    :disabled="isDownloading" @click="downloadData" />
                <span v-if="downloadError" class="data-sync-error">{{ downloadError }}</span>
            </div>

            <div class="data-sync-row">
                <input ref="fileInput" type="file"
                    accept=".gz,.tgz,application/gzip,application/x-gzip,application/x-tar"
                    class="data-sync-hidden-input" @change="onFileSelected" />
                <ActionButton variant="outline" text="Choose File" @click="fileInput.click()" />
                <span class="data-sync-filename">{{ selectedFile ? selectedFile.name : 'No file chosen' }}</span>
                <ActionButton variant="danger" :text="isUploading ? 'Uploading...' : 'Upload & Replace All Data'"
                    :disabled="!selectedFile || isUploading" @click="uploadData" />
            </div>

            <div v-if="uploadStatus" class="data-sync-status" :class="{ 'data-sync-error': uploadIsError }">
                {{ uploadStatus }}
            </div>

            <p class="data-sync-warning">
                ⚠ Upload replaces ALL data on the server. This cannot be undone.
            </p>
        </div>
    </CollapsibleAdminSection>

    <CollapsibleAdminSection title="Data Cleanup">
        <div class="cleanup-panel">
            <div class="cleanup-actions">
                <ActionButton variant="primary" :text="isScanning ? 'Scanning...' : 'Clean Up Data'"
                    :disabled="isScanning" @click="scanData" />
                <ActionButton variant="outline" size="small" text="Select All" :disabled="!items.length"
                    @click="selectAll" />
                <ActionButton variant="outline" size="small" text="Clear" :disabled="!items.length"
                    @click="clearSelection" />
            </div>

            <div v-if="error" class="cleanup-error">{{ error }}</div>

            <div v-if="!isScanning && items.length === 0" class="cleanup-empty">
                No cleanup candidates found.
            </div>

            <div v-else class="cleanup-list">
                <div v-for="group in groupedItems" :key="group.entity" class="cleanup-group">
                    <h3 class="cleanup-group-title">
                        {{ formatEntity(group.entity) }} ({{ group.items.length }})
                    </h3>

                    <div v-for="item in group.items" :key="item.key" class="cleanup-item">
                        <label class="cleanup-item-label">
                            <input type="checkbox" class="cleanup-checkbox" :checked="isSelected(item.key)"
                                @change="toggleSelection(item.key)" />
                            <span class="cleanup-item-text">{{ item.label }}</span>
                        </label>
                        <span class="cleanup-item-meta">{{ item.reasonsLabel }}</span>
                    </div>
                </div>
            </div>

            <div class="cleanup-footer">
                <div class="cleanup-count">{{ selectedCount }} selected</div>
                <ActionButton variant="danger" :text="isDeleting ? 'Deleting...' : 'Delete Selected'"
                    :disabled="selectedCount === 0 || isDeleting" @click="deleteSelected" />
            </div>
        </div>
    </CollapsibleAdminSection>
</template>

<script setup>
import { ref, computed } from 'vue'
import CollapsibleAdminSection from './CollapsibleAdminSection.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import AdminCleanupService from '@/services/admin/adminCleanupService'
import AdminDataService from '@/services/admin/adminDataService'

// Data Sync state
const fileInput = ref(null)
const selectedFile = ref(null)
const isDownloading = ref(false)
const isUploading = ref(false)
const downloadError = ref('')
const uploadStatus = ref('')
const uploadIsError = ref(false)

const onFileSelected = (e) => {
    selectedFile.value = e.target.files[0] || null
    uploadStatus.value = ''
    uploadIsError.value = false
}

const downloadData = async () => {
    isDownloading.value = true
    downloadError.value = ''
    try {
        await AdminDataService.downloadData()
    } catch (err) {
        downloadError.value = err.message || 'Download failed'
    } finally {
        isDownloading.value = false
    }
}

const uploadData = async () => {
    if (!selectedFile.value) return
    if (!confirm('This will replace ALL data on the server with the contents of the uploaded archive. This cannot be undone. Continue?')) return
    isUploading.value = true
    uploadStatus.value = ''
    uploadIsError.value = false
    try {
        await AdminDataService.uploadData(selectedFile.value)
        uploadStatus.value = 'Data imported successfully.'
        selectedFile.value = null
        if (fileInput.value) fileInput.value.value = ''
    } catch (err) {
        uploadStatus.value = err.message || 'Upload failed'
        uploadIsError.value = true
    } finally {
        isUploading.value = false
    }
}

// Data Cleanup state
const items = ref([])
const isScanning = ref(false)
const isDeleting = ref(false)
const error = ref('')
const selectedKeys = ref(new Set())

const reasonLabels = {
    isDeleted: 'isDeleted = true',
    unassignedCustomEquipment: 'Unassigned custom equipment'
}

const formatEntity = (entity) => {
    if (!entity) return 'Unknown'
    return entity.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

const groupedItems = computed(() => {
    const grouped = new Map()
    for (const item of items.value) {
        const key = item.entity || 'unknown'
        if (!grouped.has(key)) {
            grouped.set(key, [])
        }
        grouped.get(key).push({
            ...item,
            key: `${item.entity}:${item.id}`,
            reasonsLabel: (item.reasons || [])
                .map((reason) => reasonLabels[reason] || reason)
                .join(', ')
        })
    }

    return Array.from(grouped.entries()).map(([entity, groupItems]) => ({
        entity,
        items: groupItems
    }))
})

const selectedCount = computed(() => selectedKeys.value.size)

const scanData = async () => {
    try {
        isScanning.value = true
        error.value = ''
        const response = await AdminCleanupService.scan()
        items.value = response.items || []
        const allKeys = new Set(items.value.map((item) => `${item.entity}:${item.id}`))
        selectedKeys.value = allKeys
    } catch (err) {
        console.error('Error scanning cleanup data:', err)
        error.value = err.message || 'Failed to scan cleanup data'
    } finally {
        isScanning.value = false
    }
}

const selectAll = () => {
    selectedKeys.value = new Set(items.value.map((item) => `${item.entity}:${item.id}`))
}

const clearSelection = () => {
    selectedKeys.value = new Set()
}

const isSelected = (key) => {
    return selectedKeys.value.has(key)
}

const toggleSelection = (key) => {
    const next = new Set(selectedKeys.value)
    if (next.has(key)) {
        next.delete(key)
    } else {
        next.add(key)
    }
    selectedKeys.value = next
}

const deleteSelected = async () => {
    if (selectedKeys.value.size === 0) return
    if (!confirm(`Delete ${selectedKeys.value.size} selected items? This cannot be undone.`)) {
        return
    }

    try {
        isDeleting.value = true
        error.value = ''
        const selectedItems = items.value
            .filter((item) => selectedKeys.value.has(`${item.entity}:${item.id}`))
            .map((item) => ({ entity: item.entity, id: item.id }))

        const response = await AdminCleanupService.deleteItems(selectedItems)
        if (response?.errors?.length) {
            error.value = `Deleted ${response.deletedCount} items, ${response.errors.length} failed.`
        }
        await scanData()
    } catch (err) {
        console.error('Error deleting cleanup data:', err)
        error.value = err.message || 'Failed to delete cleanup data'
    } finally {
        isDeleting.value = false
    }
}
</script>

<style scoped>
.cleanup-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    background: var(--color-bg-primary);
    border-radius: var(--radius-10);
    padding: var(--space-lg);
}

.cleanup-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    align-items: center;
}

.cleanup-error {
    color: var(--color-danger);
    font-size: var(--font-size-14);
}

.cleanup-empty {
    color: var(--color-gray-light);
    font-size: var(--font-size-14);
}

.cleanup-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
}

.cleanup-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.cleanup-group-title {
    margin: 0;
    font-size: var(--font-size-18);
    color: var(--color-text-primary);
}

.cleanup-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-sm) var(--space-md);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-5);
}

.cleanup-item-label {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    cursor: pointer;
}

.cleanup-item-text {
    color: var(--color-text-primary);
    font-size: var(--font-size-14);
}

.cleanup-item-meta {
    color: var(--color-gray-light);
    font-size: var(--font-size-12);
}

.cleanup-checkbox {
    width: 16px;
    height: 16px;
}

.cleanup-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-md);
    border-top: 1px solid var(--color-gray-dark);
    padding-top: var(--space-md);
}

.cleanup-count {
    color: var(--color-text-primary);
    font-size: var(--font-size-14);
}

@media (max-width: 768px) {
    .cleanup-item {
        flex-direction: column;
        align-items: flex-start;
    }

    .cleanup-footer {
        flex-direction: column;
        align-items: flex-start;
    }
}

.data-sync-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    background: var(--color-bg-primary);
    border-radius: var(--radius-10);
    padding: var(--space-lg);
}

.data-sync-description {
    color: var(--color-text-primary);
    font-size: var(--font-size-14);
    margin: 0;
}

.data-sync-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-sm);
}

.data-sync-hidden-input {
    display: none;
}

.data-sync-filename {
    color: var(--color-gray-light);
    font-size: var(--font-size-14);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.data-sync-status {
    font-size: var(--font-size-14);
    color: var(--color-text-primary);
}

.data-sync-error {
    color: var(--color-danger);
    font-size: var(--font-size-14);
}

.data-sync-warning {
    margin: 0;
    font-size: var(--font-size-12);
    color: var(--color-gray-light);
}
</style>
