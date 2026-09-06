import { LoaderCircle, Upload } from 'lucide-react'
import { UploadDropzone } from './UploadDropzone'
import { IngestionResultScreen } from './IngestionResultScreen'
import { getIngestionError, ingestResume } from '../lib/api/ingestion.api'
import { useIngestionStore } from '../lib/stores/ingestion.store'

const progressStages = [
  { label: 'Uploading resume', threshold: 1 },
  { label: 'Extracting text', threshold: 20 },
  { label: 'Parsing profile', threshold: 45 },
  { label: 'Generating embedding', threshold: 70 },
  { label: 'Saving to collection', threshold: 90 },
]

export function ResumeUploadCard() {
  const { file, status, progress, result, error, selectFile, setProgress, setProcessing, setSuccess, setError, clear } = useIngestionStore()
  const activeStage = progressStages.reduce((stage, candidate) => progress >= candidate.threshold ? candidate : stage, progressStages[0])

  async function handleUpload() {
    if (!file) {
      setError('Please select a file.')
      return
    }
    setProcessing()
    try {
      const result = await ingestResume(file, setProgress)
      setSuccess(result)
    } catch (requestError) {
      setError(getIngestionError(requestError).message)
    }
  }

  return (
    <section className="upload-card" aria-labelledby="upload-title">
      <div className="upload-card-heading"><span className="upload-card-icon"><Upload size={16} /></span><div><h2 id="upload-title">Add a resume</h2><p>Prepare a PDF for your collection</p></div></div>
      {status === 'success' && file && result ? (
        <IngestionResultScreen fileName={file.name} result={result} onReset={clear} />
      ) : (
        <>
          <UploadDropzone selectedFile={file} onFileSelected={selectFile} onClear={clear} />
          {status === 'processing' && <div className="upload-progress-panel" role="status" aria-live="polite"><div className="upload-progress"><LoaderCircle size={16} className="spin" /><span>{activeStage.label}...</span><b>{progress}%</b></div><div className="progress-track"><span style={{ width: `${Math.max(progress, 4)}%` }} /></div><div className="stage-list">{progressStages.map((stage) => <span className={progress >= stage.threshold ? 'complete' : ''} key={stage.label}>{stage.label}</span>)}</div></div>}
          {error && <p className="upload-error" role="alert">{error}</p>}
          <div className="upload-actions"><button className="upload-cancel" type="button" onClick={clear} disabled={!file || status === 'processing'}>Clear</button><button className="upload-submit" type="button" onClick={handleUpload} disabled={status === 'processing'}>{status === 'processing' ? 'Processing...' : status === 'error' ? 'Retry' : 'Continue'}</button></div>
        </>
      )}
    </section>
  )
}
