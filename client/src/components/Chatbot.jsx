import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const SUGGESTIONS = [
  'What are the 5 pillars of Islam?',
  'How to do wudu?',
  'Tell me a hadith about patience',
  'How to pray Salah?',
  'Dua before eating',
  'What is Ayatul Kursi?',
  'What is Zakat?',
  'Ramadan fasting rules'
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'As-Salamu Alaykum! 🌙\n\nI\'m the NoorAcademy AI — trained on Islamic knowledge from our Hadith, Quran, Fiqh, and Du\'a content.\n\nAsk me anything about Islam!', time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    setMessages(prev => [...prev, { from: 'user', text: msg, time: new Date() }]);
    setInput('');
    setTyping(true);

    try {
      const res = await api.post('/ai/ask', { question: msg });
      const { answer, sources, related, confidence } = res.data;

      let response = answer;

      // Add related answers
      if (related && related.length > 0) {
        response += '\n\n**Related:**\n' + related.map(r => `• ${r}`).join('\n');
      }

      // Add sources
      if (sources && sources.length > 0) {
        const uniqueSources = [...new Set(sources.map(s => s.source))].filter(Boolean);
        if (uniqueSources.length > 0) {
          response += '\n\n📚 _Sources: ' + uniqueSources.join(', ') + '_';
        }
      }

      // Add confidence indicator
      if (confidence === 'high') response = '✅ ' + response;
      else if (confidence === 'none') response = '🔍 ' + response;

      setMessages(prev => [...prev, { from: 'bot', text: response, time: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        from: 'bot',
        text: 'I apologize, I encountered an error. Please try asking your question differently.',
        time: new Date()
      }]);
    }
    setTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button className="chatbot-fab" onClick={() => setOpen(!open)} title="Ask Islamic Questions">
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <span className="chatbot-avatar">🕌</span>
              <div>
                <div className="chatbot-title">NoorAcademy AI</div>
                <div className="chatbot-status">● Trained on Our Content</div>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg ${msg.from}`}>
                {msg.from === 'bot' && <span className="chatbot-msg-avatar">🕌</span>}
                <div className="chatbot-msg-bubble" dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
              </div>
            ))}
            {typing && (
              <div className="chatbot-msg bot">
                <span className="chatbot-msg-avatar">🕌</span>
                <div className="chatbot-msg-bubble typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {messages.length <= 2 && (
            <div className="chatbot-suggestions">
              {SUGGESTIONS.map((q, i) => (
                <button key={i} className="suggestion-chip" onClick={() => sendMessage(q)}>{q}</button>
              ))}
            </div>
          )}

          <div className="chatbot-input-area">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Hadith, Quran, Prayer..."
              className="chatbot-input"
            />
            <button className="chatbot-send" onClick={() => sendMessage()} disabled={!input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        .chatbot-fab {
          position: fixed; bottom: 24px; right: 24px; width: 60px; height: 60px;
          border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--primary-light));
          color: white; font-size: 1.5rem; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(13,107,75,0.5); z-index: 8000; transition: var(--transition);
          border: none; cursor: pointer; animation: bounce 2s infinite;
        }
        .chatbot-fab:hover { transform: scale(1.1); animation: none; }
        .chatbot-window {
          position: fixed; bottom: 96px; right: 24px; width: 420px; max-height: 620px;
          background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-xl);
          display: flex; flex-direction: column; overflow: hidden; z-index: 8000;
          animation: scaleIn 0.3s ease; box-shadow: 0 10px 50px rgba(0,0,0,0.5);
        }
        .chatbot-header {
          background: linear-gradient(135deg, var(--primary-dark), var(--primary));
          padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
        }
        .chatbot-header-info { display: flex; align-items: center; gap: 12px; }
        .chatbot-avatar { font-size: 2rem; }
        .chatbot-title { font-weight: 700; color: white; font-size: 1rem; }
        .chatbot-status { font-size: 0.75rem; color: rgba(255,255,255,0.7); }
        .chatbot-close { background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
        .chatbot-close:hover { background: rgba(255,255,255,0.2); }
        .chatbot-messages {
          flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column;
          gap: 12px; max-height: 400px; min-height: 200px;
        }
        .chatbot-msg { display: flex; gap: 8px; align-items: flex-start; }
        .chatbot-msg.user { flex-direction: row-reverse; }
        .chatbot-msg-avatar { font-size: 1.3rem; margin-top: 4px; }
        .chatbot-msg-bubble {
          max-width: 85%; padding: 12px 16px; border-radius: 16px;
          font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap; word-break: break-word;
        }
        .chatbot-msg.bot .chatbot-msg-bubble { background: var(--surface); color: var(--text); border-bottom-left-radius: 4px; }
        .chatbot-msg.user .chatbot-msg-bubble { background: var(--primary); color: white; border-bottom-right-radius: 4px; }
        .chatbot-msg-bubble strong { color: var(--accent-light); }
        .chatbot-msg-bubble em { color: var(--text-dim); font-style: italic; font-size: 0.8rem; }
        .chatbot-suggestions { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 12px; }
        .suggestion-chip {
          background: var(--surface-light); border: 1px solid var(--border); color: var(--text-muted);
          padding: 6px 12px; border-radius: var(--radius-full); font-size: 0.75rem;
          cursor: pointer; transition: var(--transition);
        }
        .suggestion-chip:hover { border-color: var(--primary); color: var(--primary-light); }
        .chatbot-input-area { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border); background: var(--surface); }
        .chatbot-input {
          flex: 1; background: var(--bg); border: 1px solid var(--border);
          border-radius: var(--radius-full); padding: 10px 16px; color: var(--text); font-size: 0.9rem;
        }
        .chatbot-input:focus { border-color: var(--primary); }
        .chatbot-send {
          width: 40px; height: 40px; border-radius: 50%; background: var(--primary);
          color: white; font-size: 1.1rem; display: flex; align-items: center; justify-content: center;
          transition: var(--transition);
        }
        .chatbot-send:hover { background: var(--primary-light); }
        .chatbot-send:disabled { opacity: 0.3; }
        .typing-indicator { display: flex; gap: 4px; padding: 12px 20px !important; }
        .typing-indicator span {
          width: 8px; height: 8px; background: var(--text-muted);
          border-radius: 50%; animation: bounce 1.4s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @media (max-width: 480px) {
          .chatbot-window { width: calc(100% - 16px); right: 8px; bottom: 88px; }
        }
      `}</style>
    </>
  );
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}
