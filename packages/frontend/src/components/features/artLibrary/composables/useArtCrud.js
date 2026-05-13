export function useArtCrud(artStore) {
    const saveArt = async (artData, selectedItems, closeModal, clearSelection) => {
        try {
            if (artData.isMultiEdit) {
                // Update multiple items with add/remove logic
                const updates = selectedItems.value.map(async (artId) => {
                    const art = artStore.getById(artId)
                    if (art) {
                        // Start with existing sources
                        let updatedSources = [...(art.sources || [])]

                        // Remove sources that should be removed
                        updatedSources = updatedSources.filter(id => !artData.sourcesToRemove.includes(id))

                        // Add sources that should be added (avoid duplicates)
                        artData.sourcesToAdd.forEach(id => {
                            if (!updatedSources.includes(id)) {
                                updatedSources.push(id)
                            }
                        })

                        const updatedArt = {
                            ...art,
                            type: artData.type,
                            sources: updatedSources
                        }
                        await artStore.update(updatedArt)
                    }
                })
                await Promise.all(updates)
                clearSelection()
                closeModal()
            } else if (artData.id) {
                // Update existing single item
                await artStore.update(artData)
            } else {
                // Create new
                await artStore.create(artData)
                closeModal()
            }
        } catch (error) {
            console.error('Error saving art:', error)
            alert('Failed to save art. Please try again.')
        }
    }

    const deleteArt = async (artData, closeModal) => {
        try {
            await artStore.remove(artData)
            closeModal()
        } catch (error) {
            console.error('Error deleting art:', error)
            alert('Failed to delete art. Please try again.')
        }
    }

    return {
        saveArt,
        deleteArt,
    }
}
