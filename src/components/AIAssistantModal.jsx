// client/src/components/AIAssistantModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AIAssistantModal() {
  const { aiOverlayOpen, setAiOverlayOpen, logout } = useAuth();
  const [selectedLang, setSelectedLang] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Select a language to begin');
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  const speak = (text, langCode = 'en-US') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCommand = (cmd, lang) => {
    const text = cmd.toLowerCase().trim();
    console.log('Recognized AI Command:', text);

    if (text.includes('cart') || text.includes('టోపీ') || text.includes('कार्ट')) {
      speak('Opening your shopping cart', lang.code);
      setAiOverlayOpen(false);
      navigate('/cart');
    } else if (text.includes('wishlist') || text.includes('కోరిక') || text.includes('विशलिस्ट')) {
      speak('Opening your wishlist', lang.code);
      setAiOverlayOpen(false);
      navigate('/wishlist');
    } else if (text.includes('order') || text.includes('ఆర్డర్') || text.includes('ऑर्डर')) {
      speak('Opening your orders', lang.code);
      setAiOverlayOpen(false);
      navigate('/orders');
    } else if (text.includes('delivered') || text.includes('డెలివరీ') || text.includes('डिलीवर')) {
      speak('Showing your delivered items', lang.code);
      setAiOverlayOpen(false);
      navigate('/delivered');
    } else if (text.includes('deals') || text.includes('offers') || text.includes('ఆఫర్లు') || text.includes('डील्स')) {
      speak('Navigating to top deals', lang.code);
      setAiOverlayOpen(false);
      navigate('/deals');
    } else if (text.includes('trending') || text.includes('brands') || text.includes('బ్రాండ్లు') || text.includes('ब्रांड्स')) {
      speak('Showing trending brands', lang.code);
      setAiOverlayOpen(false);
      navigate('/trending');
    } else if (text.includes('profile') || text.includes('account') || text.includes('ఖాతా') || text.includes('खाता')) {
      speak('Opening your profile', lang.code);
      setAiOverlayOpen(false);
      navigate('/profile');
    } else if (text.includes('support') || text.includes('help') || text.includes('service') || text.includes('మద్దతు') || text.includes('मदद')) {
      speak('Opening customer support', lang.code);
      setAiOverlayOpen(false);
      navigate('/support');
    } else if (text.includes('home') || text.includes('హోమ్') || text.includes('होम')) {
      speak('Going to home page', lang.code);
      setAiOverlayOpen(false);
      navigate('/');
    } else if (text.includes('search for') || text.includes('search') || text.includes('శోధించండి') || text.includes('खोजें')) {
      const query = text.replace(/search for|search|శోధించండి|खोजें/gi, '').trim();
      speak(`Searching for ${query}`, lang.code);
      setAiOverlayOpen(false);
      navigate(`/search?q=${encodeURIComponent(query)}`);
    } else {
      // Default to search whatever was said
      speak(`Searching for ${text}`, lang.code);
      setAiOverlayOpen(false);
      navigate(`/search?q=${encodeURIComponent(text)}`);
    }
  };

  const startListening = (lang) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatusMessage('Voice recognition is not supported in this browser.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = lang.code;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage(`Listening in ${lang.name}... Say "Open Cart", "Search Laptop", etc.`);
      };

      recognition.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setTranscript(currentTranscript);
        
        if (event.results[0].isFinal) {
          handleCommand(currentTranscript, lang);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setStatusMessage(`Error: ${event.error}. Click mic to try again.`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Recognition error:', err);
      setIsListening(false);
    }
  };

  const selectLanguage = (lang) => {
    setSelectedLang(lang);
    setTranscript('');
    startListening(lang);
  };

  const closeOverlay = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsListening(false);
    setSelectedLang(null);
    setAiOverlayOpen(false);
  };

  if (!aiOverlayOpen) return null;

  const languages = [
    { id: 'en', name: 'English', code: 'en-IN', icon: '🇬🇧' },
    { id: 'te', name: 'తెలుగు', code: 'te-IN', icon: '🇮🇳' },
    { id: 'hi', name: 'हिंदी', code: 'hi-IN', icon: '🇮🇳' },
  ];

  return (
    <div className="ai-overlay active" onClick={closeOverlay}>
      <div 
        className="ai-glass-panel relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeOverlay}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl transition"
          title="Close AI"
        >
          <i className="fas fa-times"></i>
        </button>

        <h2 className="ai-title flex items-center justify-center gap-3">
          <i className="fas fa-sparkles text-yellow-300"></i>
          NEX AI Assistant
        </h2>

        {/* Language Selection */}
        {!selectedLang ? (
          <div className="w-full">
            <p className="text-gray-300 text-sm mb-6">Choose your preferred voice navigation language:</p>
            <div className="ai-lang-grid">
              {languages.map((lang) => (
                <div
                  key={lang.id}
                  onClick={() => selectLanguage(lang)}
                  className="lang-card group"
                >
                  <span className="lang-icon">{lang.icon}</span>
                  <span className="lang-name group-hover:text-yellow-300 transition">{lang.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Listening Interface */
          <div className="flex flex-col items-center w-full">
            <button
              onClick={() => startListening(selectedLang)}
              className={`ai-mic-pulse cursor-pointer ${isListening ? 'ring-4 ring-purple-400 animate-pulse' : 'opacity-80'}`}
              title="Click to speak"
            >
              <i className={`fas ${isListening ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
            </button>

            <p className="ai-status-message mb-3 text-center">{statusMessage}</p>

            {transcript && (
              <div className="bg-white/10 px-4 py-2 rounded-xl text-yellow-300 font-medium text-lg my-3 max-w-md w-full truncate">
                "{transcript}"
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setSelectedLang(null)}
                className="text-xs text-gray-400 hover:text-white underline transition"
              >
                Change Language
              </button>
              <button
                onClick={() => startListening(selectedLang)}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-full transition"
              >
                Tap to Speak Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

