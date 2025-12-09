import { onUnmounted } from 'vue'

export function useSessionService(sessionService) {
  const connect = async () => {
    try {
      await sessionService.connect()
    } catch (error) {
      console.error('Failed to connect session service:', error)
      throw error
    }
  }

  const disconnect = () => {
    sessionService.disconnect()
  }

  // Automatically disconnect on component unmount to prevent memory leaks
  onUnmounted(() => {
    disconnect()
  })

  return {
    connect,
    disconnect,
    sessionService
  }
}
