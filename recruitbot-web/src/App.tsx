import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ChatPage } from './pages/ChatPage'
import { CandidateProfileModal } from './components/CandidateProfileModal'
import './App.css'

function App() {
  return (
    <BrowserRouter>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e1e28', color: '#f1f1f5' } }} />
      <Routes>
          <Route path="/" element={<ChatPage />} />
      </Routes>
      <CandidateProfileModal />
    </BrowserRouter>
  )
}

export default App
