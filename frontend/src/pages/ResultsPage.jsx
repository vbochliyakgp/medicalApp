import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowLeft, FaSpinner } from 'react-icons/fa'
import * as api from '../services/api'

const ResultsPage = ({ processingResults }) => {
  const [results, setResults] = useState(processingResults)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Determine what to display based on state
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Processing audio file...</p>
        </div>
      )
    }
    
    if (!results) {
      return (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 mb-4">No processed audio found</p>
          <Link to="/" className="btn-primary">
            Record New Audio
          </Link>
        </div>
      )
    }
    
    // Display results
    const displayResults = results
    
    return (
      <div className="space-y-6">
        {displayResults && (
          <>
            {/* Final Summary */}
            <div className="card">
              <h3 className="text-lg font-medium mb-2">Medical Summary</h3>
              <div className="prose max-w-none">
                {displayResults.final_summary ? (
                  <div className="whitespace-pre-line">{displayResults.final_summary}</div>
                ) : (
                  <p className="text-red-500">No summary available</p>
                )}
              </div>
            </div>
            
            {/* Transcription */}
            <div className="card">
              <h3 className="text-lg font-medium mb-2">Transcription</h3>
              <div className="bg-gray-50 p-4 rounded border">
                {displayResults.transcription ? (
                  <p className="whitespace-pre-line">{displayResults.transcription}</p>
                ) : (
                  <p className="text-red-500">No transcription available</p>
                )}
              </div>
            </div>
            
            {/* Translation (if different from transcription) */}
            {displayResults.translation && 
             displayResults.translation !== displayResults.transcription && (
              <div className="card">
                <h3 className="text-lg font-medium mb-2">English Translation</h3>
                <div className="bg-gray-50 p-4 rounded border">
                  <p className="whitespace-pre-line">{displayResults.translation}</p>
                </div>
              </div>
            )}
            
            {/* Detailed Medical Summary */}
            {displayResults.medical_summary && (
              <div className="card">
                <h3 className="text-lg font-medium mb-2">Detailed Medical Context</h3>
                <div className="bg-gray-50 p-4 rounded border">
                  <p className="whitespace-pre-line">{displayResults.medical_summary}</p>
                </div>
              </div>
            )}
            
            {/* Error Message */}
            {displayResults.error && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p className="font-bold">Error</p>
                <p>{displayResults.error}</p>
              </div>
            )}
          </>
        )}
      </div>
    )
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Processing Results</h1>
        <Link 
          to="/" 
          className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
        >
          <FaArrowLeft />
          <span>Back to Recording</span>
        </Link>
      </header>
      
      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      {renderContent()}
    </div>
  )
}

export default ResultsPage