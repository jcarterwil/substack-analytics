'use client'

import { useState, useCallback } from 'react'
import { parseSubstackZip } from '@/lib/parser'
import type { AnalysisResult } from '@/lib/types'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setError('Please upload a .zip file (Substack export)')
      return
    }

    setError(null)
    setIsProcessing(true)
    setProgress('Reading zip file...')

    try {
      setProgress('Parsing posts and subscribers...')
      const analysisResult = await parseSubstackZip(file)

      setProgress('Analysis complete!')
      setResult(analysisResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const resetAnalysis = () => {
    setResult(null)
    setError(null)
    setProgress('')
  }

  // Show dashboard if we have results
  if (result) {
    return <Dashboard result={result} onReset={resetAnalysis} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="px-8 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Substack Analyzer</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Analyze Your Substack
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your Substack export zip file to get insights about your posts,
            subscribers, and growth trends. Everything is processed locally in your browser.
          </p>
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            isDragging
              ? 'border-orange-500 bg-orange-50 scale-[1.02]'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          } ${isProcessing ? 'pointer-events-none opacity-75' : ''}`}
        >
          {isProcessing ? (
            <div>
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <svg className="w-20 h-20 text-orange-500 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p className="text-lg text-gray-700 font-medium">{progress}</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Drop your Substack export here
              </h3>
              <p className="text-gray-500 mb-6">
                or click to browse files
              </p>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 cursor-pointer transition-colors text-lg"
              >
                Select Zip File
              </label>
              <p className="text-sm text-gray-400 mt-6">
                Your data never leaves your browser
              </p>
            </>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white rounded-2xl p-8 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to export from Substack</h3>
          <ol className="space-y-3 text-gray-600">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
              <span>Go to your Substack dashboard and click Settings</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
              <span>Scroll down to &ldquo;Exports&rdquo; section</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
              <span>Click &ldquo;Create new export&rdquo; and wait for it to complete</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">4</span>
              <span>Download the zip file and upload it here</span>
            </li>
          </ol>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-8 py-8 text-center text-sm text-gray-400">
        <p>Privacy first: All processing happens locally in your browser. No data is sent to any server.</p>
      </footer>
    </div>
  )
}
