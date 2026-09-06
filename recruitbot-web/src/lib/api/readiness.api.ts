import apiClient from './client'

export interface RetrievalReadiness {
  ready: boolean
  collection: string
  resumeCount: number
  resumesWithEmbedding: number
  embeddingModel: string
  embeddingDimension: number
  reason?: string
}

export async function getRetrievalReadiness(): Promise<RetrievalReadiness> {
  const response = await apiClient.get<RetrievalReadiness>('/v1/search/readiness')
  return response.data
}
