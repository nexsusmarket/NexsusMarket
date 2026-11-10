// client/src/components/AIAssistantModal.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AIAssistantModal() {
  const { aiOverlayOpen, setAiOverlayOpen } = useAuth();
  const [selectedLang, setSelectedLang] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Listening... Speak now');
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  const speak = (text, langCode = 'en-US') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCommand = (cmd, lang) => {
    const text = cmd.toLowerCase().trim();

    if (text.includes('cart') || text.includes('basket') || text.includes('టోపీ') || text.includes('कार्ट')) {
      speak('Opening your cart', lang.code);
      closeOverlay();
      navigate('/cart');
    } else if (text.includes('wishlist') || text.includes('కోరిక') || text.includes('విష్‌లిస్ట్') || text.includes('विशलिस्ट')) {
      speak('Opening your wishlist', lang.code);
      closeOverlay();
      navigate('/wishlist');
    } else if (text.includes('order') || text.includes('ఆర్డర్') || text.includes('ऑर्डर')) {
      speak('Opening your orders', lang.code);
      closeOverlay();
      navigate('/orders');
    } else if (text.includes('delivered') || text.includes('డెలివరీ') || text.includes('डिलीवर')) {
      speak('Showing your delivered items', lang.code);
      closeOverlay();
      navigate('/delivered');
    } else if (text.includes('deals') || text.includes('deal') || text.includes('offers') || text.includes('ఆఫర్లు') || text.includes('डील')) {
      speak('Navigating to top deals', lang.code);
      closeOverlay();
      navigate('/deals');
    } else if (text.includes('trending') || text.includes('brands') || text.includes('బ్రాండ్లు') || text.includes('ब्रांड्स')) {
      speak('Showing trending brands', lang.code);
      closeOverlay();
      navigate('/trending');
    } else if (text.includes('profile') || text.includes('account') || text.includes('ఖాతా') || text.includes('खाता')) {
      speak('Opening your profile', lang.code);
      closeOverlay();
      navigate('/profile');
    } else if (text.includes('support') || text.includes('help') || text.includes('service') || text.includes('సహాయం') || text.includes('मदद')) {
      speak('Opening customer support', lang.code);
      closeOverlay();
      navigate('/support');
    } else if (text.includes('home') || text.includes('హోమ్') || text.includes('होम')) {
      speak('Going to home page', lang.code);
      closeOverlay();
      navigate('/');
    } else {
      const query = text.replace(/search for|search|వెతకండి|खोजें/gi, '').trim() || text;
      speak(`Searching for ${query}`, lang.code);
      closeOverlay();
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const startListening = (lang) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatusMessage('Speech recognition not supported in this browser');
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
      recognition.interimResults = false;

      recognition.onstart = () => {
        setStatusMessage(`Listening in ${lang.name}...`);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setStatusMessage(`"${transcript}"`);
        handleCommand(transcript, lang);
      };

      recognition.onerror = (event) => {
        setStatusMessage(`Could not hear properly (${event.error}).`);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
    }
  };

  const selectLanguage = (lang) => {
    setSelectedLang(lang);
    startListening(lang);
  };

  const closeOverlay = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setSelectedLang(null);
    setAiOverlayOpen(false);
  };

  if (!aiOverlayOpen) return null;

  return (
    <div id="nex-overlay" className="ai-overlay active" onClick={closeOverlay}>
      <div className="ai-glass-panel" onClick={(e) => e.stopPropagation()}>
        <button id="nex-close" className="close-ai-btn" onClick={closeOverlay}>
          <i className="fas fa-times"></i>
        </button>

        <h2 className="ai-title">{selectedLang ? selectedLang.name : 'Select Language'}</h2>

        {!selectedLang ? (
          <div id="ai-lang-selection" className="ai-lang-grid">
            <div
              className="lang-card"
              data-lang="en-IN"
              onClick={() => selectLanguage({ id: 'en', name: 'English', code: 'en-IN' })}
            >
              <span className="lang-icon">🇺🇸</span>
              <span className="lang-name">English</span>
            </div>

            <div
              className="lang-card"
              data-lang="te-IN"
              onClick={() => selectLanguage({ id: 'te', name: 'Telugu', code: 'te-IN' })}
            >
              <span className="lang-icon">🇮🇳</span>
              <span className="lang-name">Telugu</span>
            </div>

            <div
              className="lang-card"
              data-lang="hi-IN"
              onClick={() => selectLanguage({ id: 'hi', name: 'Hindi', code: 'hi-IN' })}
            >
              <span className="lang-icon">🇮🇳</span>
              <span className="lang-name">Hindi</span>
            </div>
          </div>
        ) : (
          <div id="ai-listening-ui" className="ai-listening-ui" style={{ display: 'flex' }}>
            <div
              className="ai-mic-pulse cursor-pointer"
              onClick={() => startListening(selectedLang)}
            >
              <i className="fas fa-microphone"></i>
            </div>
            <p id="ai-status-msg" className="ai-status-message">
              {statusMessage}
            </p>
            <button
              onClick={() => setSelectedLang(null)}
              className="mt-4 text-xs text-indigo-300 hover:text-white underline cursor-pointer"
            >
              Change Language
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
