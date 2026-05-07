import { useState } from 'react'
import axios from 'axios'
import './App.css'

const API = 'http://127.0.0.1:8000'

export default function App() {
  const [file, setFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  async function handleUpload(e) {
    const selected = e.target.files[0]
    if (!selected) return
    setFile(selected)
    setUploadStatus('Uploading...')

    const formData = new FormData()
    formData.append('file', selected)

    try {
      const res = await axios.post(`${API}/upload`, formData)
      setUploadStatus(res.data.message)
    } catch (err) {
      setUploadStatus('Upload failed. Is the backend running?')
    }
  }

  async function handleAsk() {
    if (!question.trim()) return
    const userMsg = question
    setQuestion('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setMessages(prev => [...prev, { role: 'ai', text: '...', thinking: true }])
    setLoading(true)

    try {
      const res = await axios.post(`${API}/ask`, { question: userMsg })
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'ai', text: res.data.answer }
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'ai', text: 'Something went wrong. Is the backend running?' }
      ])
    }
    setLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAsk()
  }

  return (
    <div className="container">
      <h1>📄 AI Document Assistant</h1>
      <p className="subtitle">Upload a PDF and ask questions about it</p>

      <div className="upload-section">
        <label className="upload-label">
          📁 Choose PDF
          <input type="file" accept=".pdf" onChange={handleUpload} />
        </label>
        {file && <p className="upload-status">{file.name}</p>}
        {uploadStatus && (
          <p className={`upload-status ${uploadStatus.includes('Processed') ? 'success' : uploadStatus.includes('failed') ? 'error' : ''}`}>
            {uploadStatus}
          </p>
        )}
      </div>

      <div className="chat-section">
        <div className="messages">
          {messages.length === 0 ? (
            <p className="empty-state">Upload a PDF above, then ask anything about it 👆</p>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role} ${msg.thinking ? 'thinking' : ''}`}>
                {msg.text}
              </div>
            ))
          )}
        </div>

        <div className="input-row">
          <input
            type="text"
            placeholder="Ask a question about your document..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button onClick={handleAsk} disabled={loading}>
            {loading ? '...' : 'Ask'}
          </button>
        </div>
      </div>
    </div>
  )
}