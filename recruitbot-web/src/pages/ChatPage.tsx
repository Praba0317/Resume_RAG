import { useState } from 'react'
import { Upload } from 'lucide-react'
import { ChatMain } from '../components/ChatMain'
import { ResumeUploadCard } from '../components/ResumeUploadCard'
import { SearchModeNav } from '../components/SearchModeNav'
import { HybridWeightPanel } from '../components/HybridWeightPanel'
import { ResultsLimitSelect } from '../components/ResultsLimitSelect'
import { ClearChatButton } from '../components/ClearChatButton'
import { useSearchStore } from '../lib/stores/search.store'

export function ChatPage() {
  const [showUpload, setShowUpload] = useState(false)
  const searchMode = useSearchStore((state) => state.searchMode)
  const setSearchMode = useSearchStore((state) => state.setSearchMode)

  return (
    <main className="workspace-shell">
      <aside className="sidebar" aria-label="RecruitBot controls">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">R</div>
          <div><strong>RecruitBot</strong><span><i /> Retrieval workspace</span></div>
        </div>
        <div className="sidebar-heading">Search mode</div>
        <SearchModeNav activeMode={searchMode} onChange={setSearchMode} />
        {searchMode === 'hybrid' && <HybridWeightPanel />}
        <div className="sidebar-heading records-heading">Workspace</div>
        <button className="upload-button" type="button" onClick={() => setShowUpload((visible) => !visible)}><Upload size={17} /> {showUpload ? 'Close uploader' : 'Add resumes'}</button>
        {showUpload && <div className="sidebar-uploader"><ResumeUploadCard /></div>}
        <ResultsLimitSelect />
        <ClearChatButton />
        <p className="sidebar-note">Search across your ingested resume collection with grounded candidate matches.</p>
        <div className="sidebar-footer"><span className="footer-dot" /> Systems ready</div>
      </aside>
      <ChatMain />
    </main>
  )
}
