// javaScript/aiAssistant.js

export function initNEX() {
    const overlay = document.getElementById('nex-overlay');
    const statusTitle = document.getElementById('nex-status');
    const statusSub = document.getElementById('nex-subtitle');
    const aiBlob = document.getElementById('ai-blob');
    const userBlob = document.getElementById('user-blob');
    const closeBtn = document.getElementById('nex-close');
    const langButtons = document.querySelectorAll('.liquid-btn');

    // Check Browser Support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN'; // Default
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let isAwake = false;
    let listeningForWakeWord = false;

    // --- SPEAK FUNCTION ---
    function speak(text, callback) {
        aiBlob.classList.add('talking');
        userBlob.classList.remove('listening');
        statusTitle.innerText = "NEX is speaking...";
        statusSub.innerText = text;

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Dynamic Voice Selection based on Lang
        const voices = window.speechSynthesis.getVoices();
        let langCode = recognition.lang.substring(0, 2); // 'en', 'hi', 'te'
        
        // Try to match voice to language, fallback to English
        let preferredVoice = voices.find(v => v.lang.startsWith(langCode));
        if(!preferredVoice) preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
        
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 1; 
        utterance.pitch = 1;

        utterance.onend = () => {
            aiBlob.classList.remove('talking');
            if (callback) callback();
        };

        window.speechSynthesis.speak(utterance);
    }

    // --- LANGUAGE SWITCHER LOGIC ---
    langButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all
            langButtons.forEach(b => b.classList.remove('active'));
            // Add to clicked
            e.target.classList.add('active');
            
            // Set Language
            const selectedLang = e.target.getAttribute('data-lang');
            recognition.lang = selectedLang;

            // Stop current listening to reset with new language
            recognition.stop();
            isAwake = true; // Assume awake if they clicked a button
            listeningForWakeWord = false;

            // Feedback
            if(selectedLang === 'hi-IN') speak("Namaste. Main ab Hindi mein sunungi.");
            else if(selectedLang === 'te-IN') speak("Namaskaram. Ippudu nenu Telugu vintunnanu.");
            else speak("Language switched to English.");

            // Start listening for command immediately
            setTimeout(() => {
                statusTitle.innerText = "Listening...";
                statusSub.innerText = "Say a command...";
                userBlob.classList.add('listening');
                try { recognition.start(); } catch(e) {}
            }, 2000);
        });
    });

    // --- TRIGGER ---
    document.addEventListener('click', (e) => {
        if (e.target.closest('#nex-trigger')) {
            overlay.classList.add('active');
            startListeningMode();
        }
    });

    if(closeBtn) {
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
            recognition.stop();
            window.speechSynthesis.cancel();
        });
    }

    // --- MODES ---
    function startListeningMode() {
        isAwake = false;
        listeningForWakeWord = true;
        statusTitle.innerText = "Tell 'Hey NEX'";
        statusSub.innerText = "Listening for wake word...";
        aiBlob.classList.remove('talking');
        userBlob.classList.add('listening');
        try { recognition.start(); } catch(e) {}
    }

    function activateAssistant() {
        isAwake = true;
        listeningForWakeWord = false;
        speak("Hi, how can I help you?", () => {
            statusTitle.innerText = "Listening...";
            statusSub.innerText = "Say a command...";
            userBlob.classList.add('listening');
            try { recognition.start(); } catch(e) {}
        });
    }

    // --- RECOGNITION LOOP ---
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        
        if (listeningForWakeWord) {
            if (transcript.includes('hey nex') || transcript.includes('next')) activateAssistant();
            else setTimeout(() => { try { recognition.start(); } catch(e) {} }, 1000);
        } 
        else if (isAwake) {
            processCommand(transcript);
        }
    };

    recognition.onend = () => {
        if (overlay.classList.contains('active') && !window.speechSynthesis.speaking) {
            setTimeout(() => { try { recognition.start(); } catch(e) {} }, 500);
        }
    };

    function processCommand(command) {
        userBlob.classList.remove('listening');
        // Simple command mapping
        if (command.includes('deals')) speak("Opening Deals.", () => window.location.href = 'topDeals.html');
        else if (command.includes('mobile')) speak("Opening Mobiles.", () => window.location.href = 'category.html?category=mobile');
        else if (command.includes('cart')) speak("Opening Cart.", () => window.location.href = 'cart.html');
        else if (command.includes('home')) speak("Going Home.", () => window.location.href = 'index.html');
        else speak("I didn't catch that.", () => { isAwake = true; });
    }
}