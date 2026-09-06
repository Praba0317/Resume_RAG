import { useRef, useState } from 'react'
import { FileText, UploadCloud, X } from 'lucide-react'

const MAX_FILE_SIZE = 5 * 1024 * 1024

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void
  selectedFile: File | null
  onClear: () => void
}

export function UploadDropzone({ onFileSelected, selectedFile, onClear }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  function selectFile(file?: File) {
    if (!file) return
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF resumes are supported.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Resume must be smaller than 5 MB.')
      return
    }
    setError('')
    onFileSelected(file)
  }

  return (
    <div className="upload-zone-wrap">
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Choose a PDF resume"
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inputRef.current?.click() } }}
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => { event.preventDefault(); setIsDragging(false); selectFile(event.dataTransfer.files[0]) }}
      >
        {selectedFile ? (
          <div className="selected-file">
            <FileText size={24} />
            <div><strong>{selectedFile.name}</strong><span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · PDF ready</span></div>
            <button type="button" aria-label="Remove selected resume" onClick={onClear}><X size={17} /></button>
          </div>
        ) : (
          <>
            <UploadCloud size={28} />
            <strong>Drop a resume here</strong>
            <span>or <button type="button" onClick={() => inputRef.current?.click()}>browse your files</button></span>
            <small>PDF only · up to 5 MB</small>
          </>
        )}
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => selectFile(event.target.files?.[0])} />
      </div>
      {error && <p className="upload-error" role="alert">{error}</p>}
    </div>
  )
}
