import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import RecordPage from './pages/RecordPage'
import ResultsPage from './pages/ResultsPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingResults, setProcessingResults] = useState(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route 
            path="/" 
            element={
              <RecordPage 
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                setProcessingResults={setProcessingResults}
              />
            } 
          />
          <Route 
            path="/results" 
            element={
              <ResultsPage 
                processingResults={processingResults}
              />
            } 
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </div>
  )
}

export default App