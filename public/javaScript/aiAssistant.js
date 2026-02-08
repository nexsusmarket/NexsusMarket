// javaScript/aiAssistant.js

export function initNEX() {
    const overlay = document.getElementById('nex-overlay');
    const closeBtn = document.getElementById('nex-close');
    const langGrid = document.getElementById('ai-lang-selection'); // The language cards
    const listeningUI = document.getElementById('ai-listening-ui'); // The pulse UI
    const statusText = document.getElementById('ai-status-msg');
    const langButtons = document.querySelectorAll('.lang-card');

    // Check Browser Support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let isListening = false;

    // --- 1. Open AI (Show Language Menu) ---
    document.addEventListener('click', (e) => {
        if (e.target.closest('#nex-trigger')) {
            overlay.classList.add('active');
            // Reset UI state
            langGrid.style.display = 'grid';
            listeningUI.style.display = 'none';
            document.querySelector('.ai-title').innerText = "Select Language";
        }
    });

    // --- 2. Close AI ---
    if(closeBtn) {
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
            recognition.stop();
            window.speechSynthesis.cancel();
        });
    }

    // --- 3. Handle Language Selection ---
    langButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Get selected language
            const selectedLang = e.currentTarget.getAttribute('data-lang');
            const langName = e.currentTarget.querySelector('.lang-name').innerText;
            
            recognition.lang = selectedLang;

            // UI Transition: Hide Languages -> Show Listening
            langGrid.style.display = 'none';
            listeningUI.style.display = 'flex';
            document.querySelector('.ai-title').innerText = "NEX AI";
            statusText.innerText = `${langName} selected. Listening...`;

            // Voice Feedback & Start Listening
            const feedbackText = selectedLang === 'en-IN' ? "Hi, how can I help?" : 
                                 selectedLang === 'hi-IN' ? "Namaste, boliye." : 
                                 "Namaskaram, cheppandi.";
            
            speak(feedbackText, () => {
                startListening();
            });
        });
    });

    // --- 4. Core Functions ---
    function speak(text, callback) {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        // Try to match voice to lang
        let preferredVoice = voices.find(v => v.lang.startsWith(recognition.lang.substring(0,2)));
        if(preferredVoice) utterance.voice = preferredVoice;
        
        utterance.rate = 1;
        utterance.onend = () => { if (callback) callback(); };
        window.speechSynthesis.speak(utterance);
    }

    function startListening() {
        try {
            recognition.start();
            statusText.innerText = "Listening...";
        } catch(e) {
            console.log("Mic already active");
        }
    }

    // --- 5. Recognition Results ---
    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase().trim();
        statusText.innerText = `Processing: "${command}"`;
        processCommand(command);
    };

    recognition.onend = () => {
        // If still open and not speaking, maybe restart or go back to idle
        if (overlay.classList.contains('active') && !window.speechSynthesis.speaking) {
             statusText.innerText = "Tap mic to speak again.";
        }
    };

    function processCommand(command) {
        // Simple navigation logic
        if (command.includes('deal')) navigate('topDeals.html', "Opening Deals");
        else if (command.includes('mobile')) navigate('category.html?category=mobile', "Opening Mobiles");
        else if (command.includes('laptop')) navigate('category.html?category=laptop', "Opening Laptops");
        else if (command.includes('cart')) navigate('cart.html', "Opening Cart");
        else if (command.includes('home')) navigate('index.html', "Going Home");
        else speak("Sorry, I didn't catch that.", () => startListening());
    }

    function navigate(url, speech) {
        speak(speech, () => window.location.href = url);
    }
}