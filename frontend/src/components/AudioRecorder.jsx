import { useState, useRef, useEffect } from 'react'
import { FaMicrophone, FaStop, FaTrash } from 'react-icons/fa'

const AudioRecorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  
  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Reset any previous recording
      chunksRef.current = []
      setAudioBlob(null)
      setAudioUrl(null)
      setRecordingTime(0)
      
      // Create new media recorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      // Event handlers
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        // Create blob from chunks
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        setAudioBlob(blob)
        
        // Create URL for audio playback
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop())
        
        // Callback with the recorded blob
        if (onRecordingComplete) {
          onRecordingComplete(blob)
        }
      }
      
      // Start recording
      mediaRecorder.start()
      setIsRecording(true)
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Error accessing microphone. Please make sure you have granted permission to use the microphone.')
    }
  }
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // Stop timer
      clearInterval(timerRef.current)
    }
  }
  
  // Clear recording
  const clearRecording = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
  }
  
  // Format time display (MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  // Clean up on unmount
  useEffect(() => {
    // Start timer interval only when recording
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [isRecording, audioUrl])
  
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Voice Recorder</h2>
        <div className="text-lg font-mono">{formatTime(recordingTime)}</div>
      </div>
      
      <div className="flex justify-center space-x-4">
        {!isRecording ? (
          <button 
            onClick={startRecording} 
            disabled={isRecording}
            className="btn-primary flex items-center space-x-2"
          >
            <FaMicrophone />
            <span>Start Recording</span>
          </button>
        ) : (
          <button 
            onClick={stopRecording} 
            className="btn-danger flex items-center space-x-2"
          >
            <FaStop />
            <span>Stop Recording</span>
          </button>
        )}
        
        {audioUrl && !isRecording && (
          <button 
            onClick={clearRecording} 
            className="btn-secondary flex items-center space-x-2"
          >
            <FaTrash />
            <span>Clear</span>
          </button>
        )}
      </div>
      
      {audioUrl && (
        <div className="mt-4">
          <p className="mb-2 font-medium">Review your recording:</p>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
    </div>
  )
}

export default AudioRecorder