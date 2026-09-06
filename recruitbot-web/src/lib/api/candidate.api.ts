import axios from 'axios'
import type { CandidateProfile, CandidateDetailResponse } from '../../types/candidate.types'
import { apiConfig } from '../../config/api.config'

const apiClient = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.timeoutMs,
})

export async function getCandidateDetails(resumeId: string): Promise<CandidateProfile | null> {
  try {
    const response = await apiClient.get<CandidateDetailResponse>(`/v1/resumes/${resumeId}`)
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    return null
  } catch (error) {
    console.error(`Failed to fetch candidate details for ${resumeId}:`, error)
    return null
  }
}
