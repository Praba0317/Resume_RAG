import { useEffect, useRef, useState } from 'react'
import type { CandidateProfile } from '../types/candidate.types'
import { getCandidateDetails } from '../lib/api/candidate.api'
import { useUiStore } from '../lib/stores/ui.store'
import { X } from 'lucide-react'

interface ModalState {
  candidate: CandidateProfile | null
  loading: boolean
}

export function CandidateProfileModal() {
  const [state, setState] = useState<ModalState>({ candidate: null, loading: false })
  const { isCandidateModalOpen, activeCandidateId, closeCandidateModal } = useUiStore()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isCandidateModalOpen && activeCandidateId) {
      setState({ candidate: null, loading: true })
      getCandidateDetails(activeCandidateId).then((data) => {
        setState({ candidate: data, loading: false })
      })
    }
  }, [isCandidateModalOpen, activeCandidateId])

  useEffect(() => {
    if (!isCandidateModalOpen) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeCandidateModal()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = document.querySelectorAll<HTMLElement>(
        '.candidate-modal-content button, .candidate-modal-content a, .candidate-modal-content input, .candidate-modal-content textarea, .candidate-modal-content select, .candidate-modal-content [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedRef.current?.focus()
    }
  }, [isCandidateModalOpen, closeCandidateModal])

  if (!isCandidateModalOpen) {
    return null
  }

  const { candidate, loading } = state

  return (
    <div className="candidate-modal-overlay" onClick={closeCandidateModal}>
      <div className="candidate-modal-content" role="dialog" aria-modal="true" aria-labelledby="candidate-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="candidate-modal-header">
          <div>
            {loading ? (
              <h2>Loading...</h2>
            ) : candidate ? (
              <>
                <h2 id="candidate-modal-title">{candidate.name}</h2>
                <p className="candidate-subtitle">
                  {candidate.role && <span>{candidate.role}</span>}
                  {candidate.company && <span> at {candidate.company}</span>}
                </p>
              </>
            ) : (
              <h2>Candidate Not Found</h2>
            )}
          </div>
          <button ref={closeButtonRef} className="candidate-modal-close" aria-label="Close candidate profile" onClick={closeCandidateModal}>
            <X size={24} />
          </button>
        </div>

        {candidate && !loading && (
          <div className="candidate-modal-body">
            <div className="candidate-section">
              <h3>Contact Information</h3>
              <div className="candidate-info-grid">
                {candidate.email && <div className="info-item"><span className="info-label">Email:</span> {candidate.email}</div>}
                {candidate.phone && <div className="info-item"><span className="info-label">Phone:</span> {candidate.phone}</div>}
                {candidate.location && <div className="info-item"><span className="info-label">Location:</span> {candidate.location}</div>}
              </div>
            </div>

            {candidate.summary && (
              <div className="candidate-section">
                <h3>Professional Summary</h3>
                <p>{candidate.summary}</p>
              </div>
            )}

            {candidate.skills && candidate.skills.length > 0 && (
              <div className="candidate-section">
                <h3>Skills</h3>
                <div className="skills-grid">
                  {candidate.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {candidate.experience && candidate.experience.length > 0 && (
              <div className="candidate-section">
                <h3>Experience</h3>
                <div className="experience-list">
                  {candidate.experience.map((exp, idx) => (
                    <div key={idx} className="experience-item">
                      <div className="experience-header">
                        <h4>{exp.role}</h4>
                        {exp.startDate && (
                          <span className="experience-dates">
                            {exp.startDate}
                            {exp.endDate && ` - ${exp.endDate}`}
                          </span>
                        )}
                      </div>
                      <p className="experience-company">{exp.company}</p>
                      {exp.description && <p>{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {candidate.education && candidate.education.length > 0 && (
              <div className="candidate-section">
                <h3>Education</h3>
                <div className="education-list">
                  {candidate.education.map((edu, idx) => (
                    <div key={idx} className="education-item">
                      <h4>{edu.institution}</h4>
                      {edu.degree && <p className="education-degree">{edu.degree}</p>}
                      {edu.field && <p className="education-field">{edu.field}</p>}
                      {edu.graduationYear && <p className="education-year">{edu.graduationYear}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {candidate.projects && candidate.projects.length > 0 && (
              <div className="candidate-section">
                <h3>Projects</h3>
                <div className="candidate-project-list">
                  {candidate.projects.map((project, idx) => (
                    <div className="candidate-project" key={`${project.title}-${idx}`}>
                      <h4>{project.title}</h4>
                      {project.description && <p>{project.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {candidate.certifications && candidate.certifications.length > 0 && (
              <div className="candidate-section">
                <h3>Certifications</h3>
                <div className="certification-list">
                  {candidate.certifications.map((certification, idx) => (
                    <span className="certification-tag" key={`${certification}-${idx}`}>{certification}</span>
                  ))}
                </div>
              </div>
            )}

            {candidate.fullText && (
              <div className="candidate-section">
                <h3>Full Resume Text</h3>
                <div className="resume-text">
                  {candidate.fullText}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
