import apiClient from '@/services/api/apiClient'

class AdminDataService {
  async downloadData() {
    const response = await apiClient.get('/admin/data/export', {
      responseType: 'blob',
      cache: false,
      timeout: 60000,
    })

    const url = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.download = `renaissance-data-${date}.tar.gz`
    a.href = url
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async uploadData(file) {
    const arrayBuffer = await file.arrayBuffer()
    const response = await apiClient.post('/admin/data/import', arrayBuffer, {
      headers: { 'Content-Type': 'application/octet-stream' },
      cache: false,
      timeout: 120000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    })
    return response.data
  }
}

export default new AdminDataService()
