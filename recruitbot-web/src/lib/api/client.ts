import axios from 'axios'
import { apiConfig } from '../../config/api.config'

const apiClient = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.timeoutMs,
})

apiClient.interceptors.request.use((config) => {
  config.headers.set('X-Request-ID', crypto.randomUUID())
  return config
})

export default apiClient
