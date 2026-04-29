import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { getStoredToken } from '../utils/auth.js'

function RobotLogo({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Antenna */}
      <line x1="32" y1="4" x2="32" y2="14" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="4" r="3" fill="#38bdf8" />

      {/* Head */}
      <rect x="12" y="14" width="40" height="28" rx="8" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="2" />

      {/* Eyes */}
      <circle cx="22" cy="26" r="5" fill="white" fillOpacity="0.9" />
      <circle cx="42" cy="26" r="5" fill="white" fillOpacity="0.9" />
      <circle cx="23" cy="27" r="2.5" fill="#0ea5e9" />
      <circle cx="43" cy="27" r="2.5" fill="#0ea5e9" />
      <circle cx="24" cy="26" r="1" fill="white" />
      <circle cx="44" cy="26" r="1" fill="white" />

      {/* Mouth */}
      <rect x="22" y="34" width="20" height="4" rx="2" fill="white" fillOpacity="0.6" />
      <rect x="26" y="34" width="4" height="4" rx="1" fill="#38bdf8" />
      <rect x="34" y="34" width="4" height="4" rx="1" fill="#38bdf8" />

      {/* Neck */}
      <rect x="28" y="42" width="8" height="4" rx="2" fill="white" fillOpacity="0.5" />

      {/* Body */}
      <rect x="14" y="46" width="36" height="14" rx="6" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="2" />

      {/* Body details */}
      <circle cx="24" cy="53" r="3" fill="#38bdf8" fillOpacity="0.8" />
      <rect x="30" y="50" width="12" height="3" rx="1.5" fill="white" fillOpacity="0.5" />
      <rect x="30" y="55" width="8" height="3" rx="1.5" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

function formatPrice(price) {
  if (!price && price !== 0) return 'N/A'
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(2)} Cr`
  if (price >= 100_000) return `₹${(price / 100_000).toFixed(1)} L`
  return `₹${price.toLocaleString('en-IN')}`
}

function buildSystemPrompt(properties, userName) {
  const propSummary = properties.length
    ? properties
        .slice(0, 40)
        .map(
          (p) =>
            `- [ID:${p.id}] ${p.title} | Type: ${p.type ?? 'N/A'} | Price: ${formatPrice(p.price)} | Location: ${p.location ?? 'N/A'} | ${p.sold ? 'SOLD' : 'Available'} | ${p.negotiable ? 'Negotiable' : 'Fixed price'}${p.description ? ` | Desc: ${p.description.slice(0, 80)}` : ''}`,
        )
        .join('\n')
    : 'No properties currently listed.'

  return `You are an expert real estate AI assistant called "Props" for "Real Estate Portal", a platform connecting buyers, sellers, and brokers in India.

The user's name is: ${userName}

## Your Capabilities
- Answer ANY real estate question: buying, selling, renting, investing, loans, legal, vastu, interior design, market trends, etc.
- Help users find properties from the current listings below
- Explain real estate concepts in simple terms
- Give advice on negotiations, paperwork, home loans, EMI calculations
- Discuss Indian real estate market trends, RERA, stamp duty, registration charges
- Filter and recommend properties based on user needs

## Current Property Listings on the Platform
${propSummary}

## Response Guidelines
- Be conversational, warm, and helpful
- Keep responses concise (2-4 sentences usually) unless detailed explanation is needed
- Use Indian context (₹, lakhs, crores, Indian cities, RERA, etc.)
- If asked to filter/show properties, mention relevant ones from the list above by name and price
- For filter requests (e.g. "show me apartments under 50L"), end your response with a JSON block like:
  FILTER:{"type":"Apartment","budget":{"max":5000000},"location":""}
  Only include fields the user specified. Use exact type names: Apartment, Villa, Plot, Commercial, Office, Farmhouse
- If no filter needed, do NOT include the FILTER: block
- Be honest if you don't know something
- Never make up property listings not in the list above`
}

function buildGroqBody(systemPrompt, messages) {
  return {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(({ role, content }) => ({
        role: role === 'assistant' ? 'assistant' : 'user',
        content,
      })),
    ],
    max_tokens: 1000,
    temperature: 0.7,
  }
}

function Message({ msg }) {
  const isBot = msg.role === 'assistant'
  return (
    <div className={`flex gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
      {isBot && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-600 shadow">
          <RobotLogo size={18} />
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
          isBot
            ? 'rounded-tl-sm bg-white text-slate-800 ring-1 ring-slate-200'
            : 'rounded-tr-sm bg-sky-600 text-white'
        }`}
      >
        {msg.display ?? msg.content}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-600 shadow">
        <RobotLogo size={18} />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  '🏠 Show apartments under ₹50L',
  '📈 Is it good time to buy?',
  '💰 How to get home loan?',
  '📋 What is RERA?',
  '🏡 Show villas',
  '🔑 Renting vs Buying?',
]

export default function ChatBot({ onFilterChange, properties = [] }) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true)
      const name = user?.name ?? user?.email?.split('@')[0] ?? 'there'
      setTimeout(() => {
        setMessages([
          {
            role: 'assistant',
            content: `Hey ${name}! 👋 I'm Props, your AI real estate buddy. I know everything about real estate — buying, selling, renting, loans, market trends, and more!\n\nI also have access to all current listings on this platform. What can I help you with today?`,
          },
        ])
      }, 300)
      setTimeout(() => inputRef.current?.focus(), 600)
    }
  }, [isOpen, hasGreeted, user])

  async function sendMessage(userText) {
    if (!userText.trim() || isLoading) return

    const userMsg = { role: 'user', content: userText }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)
    setShowSuggestions(false)

    try {
      const systemPrompt = buildSystemPrompt(
        properties,
        user?.name ?? user?.email?.split('@')[0] ?? 'User',
      )

      const bodyObj = buildGroqBody(systemPrompt, updatedMessages)
      const token = getStoredToken()

      const response = await fetch('http://localhost:8080/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(bodyObj),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Server error: ${response.status} — ${errText}`)
      }

      const data = await response.json()

      const rawText =
        data.choices?.[0]?.message?.content ??
        'Sorry, I could not process that. Please try again.'

      let displayText = rawText
      const filterMatch = rawText.match(/FILTER:(\{.*?\})/s)
      if (filterMatch) {
        try {
          const filterObj = JSON.parse(filterMatch[1])
          onFilterChange({
            type: filterObj.type ?? '',
            budget: filterObj.budget ?? {},
            location: filterObj.location ?? '',
          })
          displayText = rawText.replace(/FILTER:\{.*?\}/s, '').trim()
          if (!displayText) {
            displayText = "I've applied the filters! Scroll down to see the matching properties. 🎯"
          }
        } catch {
          displayText = rawText.replace(/FILTER:.*$/s, '').trim()
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: rawText, display: displayText },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err.message?.includes('401')
            ? 'Authentication failed. Please log out and log back in.'
            : err.message?.includes('400')
            ? 'Bad request — check your Groq API key and model name in application.properties.'
            : err.message?.includes('Server error')
            ? 'Server error. Please try again later.'
            : "I'm having trouble connecting right now. Please make sure the backend server is running.",
        },
      ])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleSuggestion(text) {
    sendMessage(text.replace(/^[\u{1F000}-\u{1FFFF}\u{2600}-\u{26FF}️\s]+/u, '').trim())
  }

  function handleReset() {
    setMessages([])
    setHasGreeted(false)
    setShowSuggestions(true)
    setInput('')
    onFilterChange({ type: '', budget: {}, location: '' })
  }

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 shadow-lg transition hover:bg-sky-700 hover:scale-110 active:scale-95"
        title="Chat with Props — your AI property buddy"
      >
        {isOpen ? (
          <span className="text-xl font-bold text-white">✕</span>
        ) : (
          <RobotLogo size={32} />
        )}
      </button>

      {/* ── Chat window ── */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex w-80 flex-col overflow-hidden rounded-3xl bg-slate-50 shadow-2xl ring-1 ring-slate-200 sm:w-96">

          {/* Header */}
          <div className="flex items-center gap-3 bg-sky-600 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <RobotLogo size={28} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Props 🏠</p>
              <p className="text-xs text-sky-200">
                Your AI property buddy · {properties.length} listings loaded
              </p>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={handleReset}
                  title="Clear chat"
                  className="rounded-full p-1 text-sky-200 transition hover:bg-white/20 hover:text-white text-xs"
                >
                  🔄
                </button>
              )}
              <div className="h-2 w-2 rounded-full bg-green-400" title="Online" />
            </div>
          </div>

          {/* Messages */}
          <div className="flex h-80 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            {showSuggestions && messages.length <= 1 && !isLoading && (
              <div className="flex flex-wrap gap-2 pl-9">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-600 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
              placeholder="Ask Props anything about real estate..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? '...' : '➤'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}