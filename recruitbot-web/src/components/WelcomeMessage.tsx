import { MessageCircle, Search, Sparkles } from 'lucide-react'

export function WelcomeMessage() {
  return <div className="chat-welcome"><div className="welcome-icon"><Sparkles size={22} /></div><span className="eyebrow">Recruiter workspace</span><h2>Ask your resume library.</h2><p>Describe the candidate you need in plain language. RecruitBot will surface the strongest evidence from your collection.</p><div className="welcome-modes"><span><Sparkles size={14} /> Semantic matches</span><span><Search size={14} /> Keyword precision</span><span><MessageCircle size={14} /> Combined retrieval</span></div></div>
}
