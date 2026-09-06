import { create } from 'zustand'

interface UiState {
  isSearching: boolean
  isMobileMenuOpen: boolean
  isCandidateModalOpen: boolean
  activeCandidateId: string | null
  setSearching: (isSearching: boolean) => void
  toggleMobileMenu: () => void
  openCandidateModal: (candidateId: string) => void
  closeCandidateModal: () => void
}

export const useUiStore = create<UiState>((set) => ({
  isSearching: false,
  isMobileMenuOpen: false,
  isCandidateModalOpen: false,
  activeCandidateId: null,
  setSearching: (isSearching) => set({ isSearching }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  openCandidateModal: (activeCandidateId) => set({ activeCandidateId, isCandidateModalOpen: true }),
  closeCandidateModal: () => set({ activeCandidateId: null, isCandidateModalOpen: false }),
}))
