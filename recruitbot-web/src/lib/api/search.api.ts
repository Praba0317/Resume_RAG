import axios from 'axios'
import { apiConfig } from '../../config/api.config'
import type { SearchRequest, SearchResponse } from '../../types/search.types'

const apiClient = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.timeoutMs,
})

export async function searchResumes(request: SearchRequest): Promise<SearchResponse | null> {
  try {
    const searchPayload = {
      query: request.query,
      mode: request.mode,
      topK: request.topK,
      ...(request.filters && { filters: request.filters }),
      ...(request.mode === 'hybrid' && request.weights && {
        bm25Weight: request.weights.bm25 / 100,
        vectorWeight: request.weights.vector / 100,
      }),
      rerankTopN: Math.min(request.topK, 10),
    }

    const response = await apiClient.post<SearchResponse>('/v1/search', searchPayload)
    return response.data
  } catch (error) {
    console.error('Search request failed:', error)
    return null
  }
}
