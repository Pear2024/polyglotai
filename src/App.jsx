import { useState, useEffect, useRef } from 'react';
import './index.css';

const LANGUAGES = {
  'en-US': 'English',
  'th-TH': 'Thai',
  'es-ES': 'Spanish'
};

function App() {
  const [sourceLang, setSourceLang] = useState('en-US');
  const [targetLang, setTargetLang] = useState('th-TH');
  
  const [isListening, setIsListening] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [status, setStatus] = useState('Ready to translate');
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setStatus('Listening...');
      };
      
      recognitionRef.current.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        setSourceText(fullTranscript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setStatus('Processing translation...');
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        setStatus(`Error: ${event.error}`);
      };
    } else {
      setStatus("Speech Recognition API not supported in this browser.");
    }
  }, []);

  // Set language for recognition whenever it changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = sourceLang;
    }
  }, [sourceLang]);

  // Trigger translation when listening stops and we have text
  useEffect(() => {
    if (!isListening && sourceText.trim() !== '') {
      translateText(sourceText);
    }
  }, [isListening, sourceText]);

  const translateText = async (text) => {
    try {
      // Extract short codes for MyMemory API (e.g. 'en', 'th', 'es')
      const srcCode = sourceLang.split('-')[0];
      const tgtCode = targetLang.split('-')[0];
      
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${srcCode}|${tgtCode}`);
      const data = await response.json();
      
      if (data && data.responseData && data.responseData.translatedText) {
        const translated = data.responseData.translatedText;
        setTranslatedText(translated);
        setStatus('Translation complete');
        
        // Speak the translation
        speakText(translated, targetLang);
      } else {
        setStatus('Translation failed');
      }
    } catch (error) {
      console.error("Translation error", error);
      setStatus('Translation failed');
    }
  };

  const speakText = (text, lang) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setSourceText('');
      setTranslatedText('');
      recognitionRef.current.start();
    }
  };

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Polyglot AI</h1>
        <p>Real-time speech translation (English • Thai • Spanish)</p>
      </div>

      <div className="controls">
        <div className="lang-selector">
          <label>Spoken Language</label>
          <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
            {Object.entries(LANGUAGES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        <button className="swap-btn" onClick={handleSwap} title="Swap languages">
          ⇄
        </button>

        <div className="lang-selector">
          <label>Target Language</label>
          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
            {Object.entries(LANGUAGES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="translator-panels">
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">{LANGUAGES[sourceLang]}</span>
          </div>
          <div className={`text-content ${!sourceText ? 'placeholder' : ''}`}>
            {sourceText || 'Press the microphone and start speaking...'}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title target">{LANGUAGES[targetLang]}</span>
          </div>
          <div className={`text-content ${!translatedText ? 'placeholder' : ''}`}>
            {translatedText || 'Translation will appear here...'}
          </div>
        </div>
      </div>

      <div className="mic-container">
        <button 
          className={`mic-btn ${isListening ? 'listening' : ''}`} 
          onClick={toggleListening}
        >
          {isListening ? '⏹' : '🎤'}
        </button>
      </div>
      
      <div className="status-indicator">
        {status}
      </div>
    </div>
  );
}

export default App;
