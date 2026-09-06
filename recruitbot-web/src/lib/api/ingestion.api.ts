import apiClient from './client'

export interface IngestionApiError {
  code: string
  message: string
}

export interface IngestionResponse {
  success: boolean
  resumeId: string
  data: {
    name?: string
    role?: string
    company?: string
    totalExperience?: number
    skillsCount: number
    embeddingModel?: string
    embeddingDimension?: number
  }
  timings: { totalMs: number }
}

export async function ingestResume(file: File, onProgress: (progress: number) => void): Promise<IngestionResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post<IngestionResponse>('/v1/resume/inject', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (event.total) onProgress(Math.round((event.loaded / event.total) * 100))
    },
  })
  return response.data
}

export function getIngestionError(error: unknown): IngestionApiError {
  const requestError = error as {
    response?: { data?: { errorCode?: string; message?: string } }
    request?: unknown
  }
  const responseData = requestError.response?.data
  if (responseData?.errorCode === 'RESUME_EXTRACTION_FAILED') {
    return { code: responseData.errorCode, message: 'We could not extract text from this PDF.' }
  }
  if (responseData?.errorCode === 'RESUME_PARSE_FAILED') {
    return { code: responseData.errorCode, message: 'We could not read a candidate profile from this resume.' }
  }
  if (responseData?.errorCode === 'EMBEDDING_FAILED') {
    return { code: responseData.errorCode, message: 'Embedding generation failed. Please retry.' }
  }
  if (responseData?.errorCode === 'INGESTION_FAILED') {
    return { code: responseData.errorCode, message: 'The resume could not be saved. Please retry.' }
  }
  if (requestError.request && !requestError.response) {
    return { code: 'NETWORK_ERROR', message: 'Could not reach the ingestion service.' }
  }
  return { code: responseData?.errorCode || 'INGESTION_FAILED', message: responseData?.message || 'Resume ingestion failed. Please retry.' }
}
