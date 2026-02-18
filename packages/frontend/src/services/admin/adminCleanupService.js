import apiClient from '@/services/api/apiClient'

class AdminCleanupService {
  async scan() {
    const response = await apiClient.get('/admin/cleanup/scan', { cache: false })
    return response.data
  }

  async deleteItems(items) {
    const response = await apiClient.post('/admin/cleanup/delete', { items })
    return response.data
  }
}

export default new AdminCleanupService()
