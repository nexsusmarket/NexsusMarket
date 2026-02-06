// javaScript/aiAssistant.js

export function initNEX() {
    const overlay = document.getElementById('nex-overlay');
    const statusTitle = document.getElementById('nex-status');
    const statusSub = document.getElementById('nex-subtitle');
    const aiBlob = document.getElementById('ai-blob');
    const userBlob = document.getElementById('user-blob');
    const closeBtn = document.getElementById('nex-close');

    // Check Browser Support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn("Voice Assistant not supported in this browser.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; 
    recognition.lang = 'en-IN'; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let isAwake = false; 
    let listeningForWakeWord = false;

    // --- SPEAKING FUNCTION ---
    function speak(text, callback) {
        aiBlob.classList.add('talking');
        userBlob.classList.remove('listening');
        statusTitle.innerText = "NEX is speaking...";
        statusSub.innerText = text;

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onend = () => {
            aiBlob.classList.remove('talking');
            if (callback) callback();
        };

        window.speechSynthesis.speak(utterance);
    }

    // --- UPDATED UI CONTROLS (Event Delegation) ---
    // This allows the button to work even though auth.js injects it later
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('#nex-trigger');
        if (trigger) {
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

    // --- LISTENING MODES ---
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
            statusSub.innerText = "Say a command (e.g., 'Open Deals')";
            userBlob.classList.add('listening'); 
            try { recognition.start(); } catch(e) {}
        });
    }

    // --- RECOGNITION LOGIC ---
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        
        if (listeningForWakeWord) {
            if (transcript.includes('hey nex') || transcript.includes('next') || transcript.includes('hey next')) {
                activateAssistant();
            } else {
                statusSub.innerText = `Heard: "${transcript}". Try 'Hey NEX'`;
                setTimeout(() => { try { recognition.start(); } catch(e) {} }, 1000);
            }
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

    // --- COMMAND PROCESSOR ---
    function processCommand(command) {
        userBlob.classList.remove('listening');
        
        if (command.includes('open deals') || command.includes('top deals')) {
            speak("Opening Top Deals page.", () => window.location.href = 'topDeals.html');
        } 
        else if (command.includes('mobile') || command.includes('phone')) {
            speak("Taking you to Mobiles.", () => window.location.href = 'category.html?category=mobile');
        }
        else if (command.includes('fashion') || command.includes('clothes')) {
            speak("Opening Fashion section.", () => window.location.href = 'category.html?category=fashion');
        }
        else if (command.includes('cart')) {
            speak("Opening your cart.", () => window.location.href = 'cart.html');
        }
        else if (command.includes('profile') || command.includes('account')) {
            speak("Going to your profile.", () => window.location.href = 'profile.html');
        }
        else if (command.includes('home')) {
            speak("Going back home.", () => window.location.href = 'index.html');
        }
        else if (command.includes('search for')) {
            const term = command.replace('search for', '').trim();
            speak(`Searching for ${term}`, () => {
               // Your existing search logic, or a simple alert for now
               console.log("Search triggered for:", term);
            });
        }
        else {
            speak("I didn't catch that.", () => { isAwake = true; });
        }
    }
}