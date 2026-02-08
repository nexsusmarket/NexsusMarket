// javaScript/aiAssistant.js

// javaScript/aiAssistant.js

export function initNEX() {
    const overlay = document.getElementById('nex-overlay');
    const closeBtn = document.getElementById('nex-close');
    
    const orb = document.getElementById('ai-orb');
    const langContainer = document.getElementById('ai-lang-container');
    const statusText = document.getElementById('ai-status-text');
    const langButtons = document.querySelectorAll('.lang-card');

    // Check Support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let isListening = false;

    // --- 1. Open AI Logic ---
    document.addEventListener('click', (e) => {
        if (e.target.closest('#nex-trigger')) {
            overlay.classList.add('active');
            resetInterface();
        }
    });

    // --- 2. Close AI Logic ---
    if(closeBtn) {
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
            stopListening();
        });
    }

    function resetInterface() {
        // Show Languages, Reset Orb, Clear Text
        langContainer.classList.remove('hidden');
        orb.classList.remove('listening');
        statusText.innerText = "Select Language";
        stopListening();
    }

    // --- 3. Language Selection & Greeting ---
    langButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lang = e.currentTarget.getAttribute('data-lang');
            recognition.lang = lang;

            // 1. Hide buttons
            langContainer.classList.add('hidden');
            
            // 2. Animate Orb
            orb.classList.add('listening');
            
            // 3. Determine Greeting
            let greeting = "";
            let displayText = "";

            if (lang === 'en-IN') {
                greeting = "Welcome to Nexsus Market. How can I help you?";
                displayText = "Listening...";
            } else if (lang === 'te-IN') {
                greeting = "Namaskaram. Nenu meeku ela sahayam cheyagalanu?";
                displayText = "Vintunnanu... (Listening)";
            } else if (lang === 'hi-IN') {
                greeting = "Namaste. Main aapki kaise madad kar sakti hoon?";
                displayText = "Sun rahi hoon... (Listening)";
            }

            statusText.innerText = "Speaking...";

            // 4. Speak & Then Listen
            speak(greeting, () => {
                statusText.innerText = displayText;
                startListening();
            });
        });
    });

    // --- 4. Core Functions ---
    function speak(text, callback) {
        window.speechSynthesis.cancel(); // Stop any previous speech
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Better Voice Selection
        const voices = window.speechSynthesis.getVoices();
        let langCode = recognition.lang.substring(0, 2);
        let preferredVoice = voices.find(v => v.lang.startsWith(langCode) && v.name.includes('Google'));
        if(preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => { if (callback) callback(); };
        window.speechSynthesis.speak(utterance);
    }

    function startListening() {
        try {
            recognition.start();
        } catch(e) { console.log("Mic error or already active"); }
    }

    function stopListening() {
        recognition.stop();
        window.speechSynthesis.cancel();
    }

    // --- 5. Action Handling ---
    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase().trim();
        statusText.innerText = `Processing: "${command}"`;
        
        // Brief delay for user to read
        setTimeout(() => processCommand(command), 800);
    };

    recognition.onend = () => {
        // If still active and not speaking, revert orb state
        if (overlay.classList.contains('active') && !window.speechSynthesis.speaking) {
             orb.classList.remove('listening');
             statusText.innerText = "Tap language to restart.";
             // Optional: bring back language menu after timeout? 
             // For now, let's just show buttons again
             setTimeout(() => langContainer.classList.remove('hidden'), 1000);
        }
    };

    function processCommand(command) {
        if (command.includes('deal')) navigate('topDeals.html', "Opening Deals");
        else if (command.includes('mobile')) navigate('category.html?category=mobile', "Opening Mobiles");
        else if (command.includes('laptop')) navigate('category.html?category=laptop', "Opening Laptops");
        else if (command.includes('cart')) navigate('cart.html', "Opening Cart");
        else if (command.includes('home')) navigate('index.html', "Going Home");
        else {
            speak("Sorry, I didn't catch that.", () => {
                orb.classList.remove('listening');
                langContainer.classList.remove('hidden');
            });
        }
    }

    function navigate(url, speech) {
        speak(speech, () => window.location.href = url);
    }
}