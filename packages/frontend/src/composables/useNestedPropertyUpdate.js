export function useNestedPropertyUpdate(data, updateCallback) {
  const updateNestedProperty = (key, value) => {
    const keys = key.split('.')
    
    // Create immutable copy
    const updatedData = JSON.parse(JSON.stringify(data.value))
    let target = updatedData

    // Traverse to the second-to-last key
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) {
        target[keys[i]] = {}
      }
      target = target[keys[i]]
    }

    // Update the final key
    target[keys[keys.length - 1]] = value

    updateCallback(updatedData)
  }

  return {
    updateNestedProperty
  }
}
