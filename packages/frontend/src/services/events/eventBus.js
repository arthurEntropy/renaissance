class EventBus {
  constructor() {
    this.listeners = new Map()
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    
    this.listeners.get(event).push(callback)
    
    // Return unsubscribe function
    return () => this.off(event, callback)
  }

  off(event, callback) {
    if (!this.listeners.has(event)) {
      return
    }
    
    const callbacks = this.listeners.get(event)
    const index = callbacks.indexOf(callback)
    
    if (index !== -1) {
      callbacks.splice(index, 1)
    }
    
    // Clean up if no listeners remain
    if (callbacks.length === 0) {
      this.listeners.delete(event)
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) {
      return
    }
    
    const callbacks = this.listeners.get(event)
    
    // Call each callback, catching errors to prevent one failure from stopping others
    for (const callback of callbacks) {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error)
      }
    }
  }

  once(event, callback) {
    const wrapper = (data) => {
      callback(data)
      this.off(event, wrapper)
    }
    
    return this.on(event, wrapper)
  }

  clear(event = null) {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  listenerCount(event) {
    return this.listeners.get(event)?.length || 0
  }

  eventNames() {
    return Array.from(this.listeners.keys())
  }
}

// Singleton instance
const eventBus = new EventBus()

export const ROLL_EVENTS = {
  SKILL_CHECK: 'roll:skill-check',
  CUSTOM_ROLL: 'roll:custom',
  DAMAGE_ROLL: 'roll:damage',
  ENGAGEMENT: 'roll:engagement',
  OPPOSED_SKILL_CHECK: 'roll:opposed-skill-check',
  INITIATIVE_ROLL: 'roll:initiative',
  INJURY_ROLL: 'roll:injury'
}

export default eventBus
