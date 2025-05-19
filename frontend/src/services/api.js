import axios from 'axios'

const API_URL = 'https://medicalapp-vp0t.onrender.com'  // Using Vite's proxy

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 120000,  // 2 minutes timeout for long processes
})

export const uploadAudio = async (audioBlob, filename = 'recording.wav') => {
  try {
    const formData = new FormData()
    formData.append('file', audioBlob, filename)
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data
  } catch (error) {
    console.error('Error uploading audio:', error)
    throw error
  }
}

export const processAudio = async (fileId) => {
  try {
    const response = await api.get(`/process/${fileId}`)
    return response.data
  } catch (error) {
    console.error('Error processing audio:', error)
    throw error
  }
}

export const getFiles = async () => {
  try {
    const response = await api.get('/files')
    // Ensure we always return an array
    return response.data.files || []
  } catch (error) {
    console.error('Error getting files:', error)
    // Return empty array on error rather than throwing
    return []
  }
}

export default {
  uploadAudio,
  processAudio,
  getFiles,
}