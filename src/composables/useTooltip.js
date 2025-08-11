import { ref, reactive } from 'vue'

export function useTooltip() {
  // State
  const tooltips = reactive({})
  const position = ref({ x: 0, y: 0 })
  const timer = ref(null)
  const showDelay = ref(1000) // Default 1 second delay

  const startTooltip = (type, data, event, delay = showDelay.value) => {
    // Clear any existing timer and tooltips
    clearAllTooltips()
    
    timer.value = setTimeout(() => {
      tooltips[type] = data
      position.value = {
        x: event.clientX + 12,
        y: event.clientY + 12,
      }
    }, delay)
  }

  /**
   * Clear a specific tooltip
   * @param {string} type - The type/key of the tooltip to clear
   */
  const clearTooltip = (type) => {
    clearTimeout(timer.value)
    delete tooltips[type]
  }

  /**
   * Clear all tooltips and timers
   */
  const clearAllTooltips = () => {
    clearTimeout(timer.value)
    Object.keys(tooltips).forEach(key => delete tooltips[key])
  }

  /**
   * Get a specific tooltip's data
   * @param {string} type - The type/key of the tooltip
   * @returns {any} The tooltip data or null
   */
  const getTooltip = (type) => {
    return tooltips[type] || null
  }

  /**
   * Check if a specific tooltip is active
   * @param {string} type - The type/key of the tooltip
   * @returns {boolean} True if the tooltip is active
   */
  const hasTooltip = (type) => {
    return !!tooltips[type]
  }

  /**
   * Set a custom show delay
   * @param {number} delay - Delay in milliseconds
   */
  const setShowDelay = (delay) => {
    showDelay.value = delay
  }

  return {
    // State
    tooltips,
    position,
    
    // Methods
    startTooltip,
    clearTooltip,
    clearAllTooltips,
    getTooltip,
    hasTooltip,
    setShowDelay,
  }
}
