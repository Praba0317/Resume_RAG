import { create } from 'zustand'
import type { IngestionResponse } from '../api/ingestion.api'

type IngestionStatus = 'idle' | 'processing' | 'success' | 'error'

interface IngestionState {
  file: File | null
  status: IngestionStatus
  progress: number
  result: IngestionResponse | null
  error: string
  selectFile: (file: File) => void
  setProgress: (progress: number) => void
  setProcessing: () => void
  setSuccess: (result: IngestionResponse) => void
  setError: (message: string) => void
  clear: () => void
}

export const useIngestionStore = create<IngestionState>((set) => ({
  file: null,
  status: 'idle',
  progress: 0,
  result: null,
  error: '',
  selectFile: (file) => set({ file, status: 'idle', progress: 0, result: null, error: '' }),
  setProgress: (progress) => set({ progress }),
  setProcessing: () => set({ status: 'processing', progress: 0, result: null, error: '' }),
  setSuccess: (result) => set({ status: 'success', progress: 100, result, error: '' }),
  setError: (message) => set({ status: 'error', error: message }),
  clear: () => set({ file: null, status: 'idle', progress: 0, result: null, error: '' }),
}))
