export interface CandidateProfile {
  resumeId: string
  name: string
  email?: string
  phone?: string
  role?: string
  company?: string
  location?: string
  summary?: string
  experience?: CandidateExperience[]
  education?: CandidateEducation[]
  skills?: string[]
  projects?: CandidateProject[]
  certifications?: string[]
  fullText?: string
  metadata?: {
    uploadedAt?: string
    lastModified?: string
    source?: string
  }
}

export interface CandidateExperience {
  company: string
  role: string
  startDate?: string
  endDate?: string
  description?: string
}

export interface CandidateEducation {
  institution: string
  degree?: string
  field?: string
  graduationYear?: string
}

export interface CandidateProject {
  title: string
  description?: string
}

export interface CandidateDetailResponse {
  success: boolean
  data?: CandidateProfile
  error?: string
}
