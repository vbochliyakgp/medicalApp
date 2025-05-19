import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaUpload, FaSpinner } from 'react-icons/fa'
import AudioRecorder from '../components/AudioRecorder'
import * as api from '../services/api'

const RecordPage = ({ isProcessing, setIsProcessing, setProcessingResults }) => {
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  
  const navigate = useNavigate()
  
  // Handle recording completion
  const handleRecordingComplete = (blob) => {
    setRecordedBlob(blob)
    setError(null)
  }
  
  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check if the file type is audio
      if (!file.type.startsWith('audio/')) {
        setError('Only audio files are supported')
        return
      }
      
      // We'll let the server handle specific file type validation
      setUploadedFile(file)
      setRecordedBlob(null)
      setError(null)
    }
  }
  
  // Process the audio (upload and start processing)
  const handleProcessAudio = async () => {
    const audioToProcess = recordedBlob || uploadedFile
    
    if (!audioToProcess) {
      setError('Please record or upload an audio file first')
      return
    }
    
    try {
      setError(null)
      setIsUploading(true)
      
      // Upload the audio file
      const uploadResult = await api.uploadAudio(
        audioToProcess, 
        uploadedFile ? uploadedFile.name : 'recording.wav'
      )
      
      // Start processing
      setIsProcessing(true)
      setIsUploading(false)
      
      const processingResult = await api.processAudio(uploadResult.file_id)
      
      setProcessingResults(processingResult)
      setIsProcessing(false)
      
      // Navigate to results page
      navigate('/results')
      
    } catch (err) {
      setIsUploading(false)
      setIsProcessing(false)
      setError(`Error: ${err.response?.data?.detail || err.message}`)
    }
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">Record Patient Audio</h1>
        <p className="mt-2 text-lg text-gray-600">
          Record or upload audio describing medical symptoms for AI processing
        </p>
      </header>
      
      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        </div>
        
        <div className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Upload Audio File</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="audio-upload"
              accept="audio/wav,audio/mp3"
              onChange={handleFileChange}
              className="hidden"
            />
            <label 
              htmlFor="audio-upload" 
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <FaUpload className="text-3xl text-gray-400" />
              <span className="text-sm text-gray-500">
                Click to upload audio file (WAV or MP3)
              </span>
            </label>
          </div>
          
          {uploadedFile && (
            <div className="mt-4">
              <p className="font-medium">Selected file:</p>
              <p className="text-gray-600">{uploadedFile.name}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={handleProcessAudio}
          disabled={isUploading || isProcessing || (!recordedBlob && !uploadedFile)}
          className="btn-primary px-8 py-3 text-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {(isUploading || isProcessing) ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>{isUploading ? 'Uploading...' : 'Processing...'}</span>
            </>
          ) : (
            <span>Process Audio</span>
          )}
        </button>
      </div>
    </div>
  )
}

export default RecordPage