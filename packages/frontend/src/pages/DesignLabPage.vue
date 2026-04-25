<template>
    <main class="design-lab-page">
        <header class="design-lab-header">
            <p class="eyebrow">Admin Tools</p>
            <h1>Design Lab</h1>
            <p class="intro">
                Visual inventory for current icon assets and floating action button variants.
            </p>
        </header>

        <section class="inventory-section" aria-label="Asset inventory">
            <h2 class="section-title">Icons</h2>
            <p class="count">{{ assetItems.length }} assets</p>
            <div class="groups-wrap">
                <section v-for="group in groupedAssets" :key="group.folder" class="asset-group">
                    <h3 class="group-title">{{ group.label }}</h3>
                    <div class="asset-grid">
                        <article v-for="asset in group.items" :key="asset.path" class="asset-card">
                            <div class="tile-wrap">
                                <div class="asset-tile" role="img" :aria-label="asset.label">
                                    <img :src="asset.url" :alt="asset.label" loading="lazy" decoding="async" />
                                </div>
                            </div>
                        </article>
                    </div>
                </section>
            </div>
        </section>

        <section class="fab-section" aria-label="Floating Action Button inventory">
            <h2 class="section-title">Floating Action Buttons</h2>
            <p class="count">{{ fabVariants.length }} variations</p>

            <div class="groups-wrap">
                <section v-for="group in fabGroups" :key="group.type" class="asset-group">
                    <h3 class="group-title">{{ group.label }}</h3>
                    <div class="fab-grid">
                        <article v-for="variant in group.items" :key="variant.id" class="fab-card">
                            <div class="edit-trigger hover fab-trigger">
                                <FloatingActionButton :type="variant.type" :size="variant.size"
                                    :visibility="variant.visibility" />
                            </div>
                            <p class="variant-label">{{ variant.label }}</p>
                        </article>
                    </div>
                </section>
            </div>
        </section>
    </main>
</template>

<script setup>
import { computed } from 'vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES as FAB_TYPE_VALUES, FAB_SIZES as FAB_SIZE_VALUES, FAB_VISIBILITIES as FAB_VISIBILITY_VALUES } from '@/constants/fab'

const FAB_TYPES = Object.values(FAB_TYPE_VALUES)
const FAB_SIZES = Object.values(FAB_SIZE_VALUES)
const FAB_VISIBILITIES = Object.values(FAB_VISIBILITY_VALUES)

const pngModules = import.meta.glob('/src/assets/**/*.png', {
    eager: true,
    import: 'default',
})

const assetItems = computed(() => {
    return Object.entries(pngModules)
        .map(([path, url]) => {
            const cleanPath = path.replace('/src/assets/', '')
            const fileName = cleanPath.split('/').pop() || cleanPath
            const label = fileName.replace(/\.png$/i, '').replace(/[_-]/g, ' ')

            return {
                path: cleanPath,
                label,
                url,
            }
        })
        .sort((a, b) => a.path.localeCompare(b.path))
})

const groupedAssets = computed(() => {
    const groups = assetItems.value.reduce((acc, asset) => {
        const parts = asset.path.split('/')
        const folder = parts.slice(0, -1).join('/') || 'root'
        if (!acc.has(folder)) {
            acc.set(folder, [])
        }
        acc.get(folder).push(asset)
        return acc
    }, new Map())

    return Array.from(groups.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([folder, items]) => ({
            folder,
            label: formatGroupLabel(folder),
            items,
        }))
})

const formatGroupLabel = (folder) => {
    if (folder === 'icons') {
        return 'General'
    }

    const withoutIconsPrefix = folder.startsWith('icons/')
        ? folder.slice('icons/'.length)
        : folder

    return withoutIconsPrefix
        .split('/')
        .map((segment) => toTitleCase(segment))
        .join(' / ')
}

const toTitleCase = (value) => {
    return value
        .split(/[_\-\s]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

const fabVariants = computed(() => {
    const variants = []

    for (const type of FAB_TYPES) {
        for (const size of FAB_SIZES) {
            for (const visibility of FAB_VISIBILITIES) {
                const id = [type, size, visibility].join('|')
                const label = [size, visibility].join(' • ')

                variants.push({
                    id,
                    type,
                    size,
                    visibility,
                    label,
                })
            }
        }
    }

    return variants
})

const fabGroups = computed(() => {
    const groups = new Map()

    for (const variant of fabVariants.value) {
        if (!groups.has(variant.type)) {
            groups.set(variant.type, [])
        }
        groups.get(variant.type).push(variant)
    }

    return Array.from(groups.entries()).map(([type, items]) => ({
        type,
        label: toTitleCase(type),
        items,
    }))
})
</script>

<style scoped>
.design-lab-page {
    min-height: 100%;
    padding: var(--space-xl) var(--space-lg);
    display: grid;
    gap: var(--space-xxl, 32px);
}

.design-lab-header {
    margin-bottom: 0;
}

.eyebrow {
    margin: 0;
    font-size: var(--font-size-14);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted, var(--color-gray-light));
}

h1 {
    margin: var(--space-xs) 0 0;
    color: var(--color-primary);
}

.intro {
    margin: var(--space-sm) 0 0;
    max-width: 760px;
    color: var(--color-white);
    line-height: 1.5;
}

.count {
    margin: var(--space-sm) 0 0;
    color: var(--color-gray-light);
    font-size: var(--font-size-14);
}

.section-title {
    margin: 0;
    color: var(--color-white);
    font-size: var(--font-size-24, 24px);
}

.inventory-section,
.fab-section {
    display: grid;
    gap: var(--space-md);
}

.groups-wrap {
    display: grid;
    gap: var(--space-xl);
}

.asset-group {
    display: grid;
    gap: var(--space-md);
}

.group-title {
    margin: 0;
    color: var(--color-primary);
    font-size: var(--font-size-16);
    text-transform: none;
}

.asset-grid {
    display: grid;
    gap: var(--space-md);
    grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
}

.asset-card {
    padding: 0;
}

.tile-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
}

.asset-tile {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    background: #fff;
}

.asset-tile img {
    max-width: 36px;
    max-height: 36px;
    object-fit: contain;
    filter: brightness(0);
}

.fab-grid {
    display: grid;
    gap: var(--space-md);
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.fab-card {
    display: grid;
    gap: var(--space-sm);
    justify-items: center;
    align-content: start;
}

.fab-trigger {
    width: 100%;
    min-height: 40px;
    display: grid;
    place-items: center;
}

.variant-label {
    margin: 0;
    text-align: center;
    color: var(--color-gray-light);
    font-size: 11px;
    line-height: 1.3;
    text-wrap: balance;
}

@media (max-width: 720px) {
    .design-lab-page {
        padding: var(--space-lg) var(--space-md);
    }

    .asset-grid {
        grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
    }

    .fab-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    }
}
</style>
