// javaScript/aiAssistant.js

export function initNEX() {
    const overlay = document.getElementById('nex-overlay');
    const statusTitle = document.getElementById('nex-status');
    const statusSub = document.getElementById('nex-subtitle');
    const aiBlob = document.getElementById('ai-blob');
    const userBlob = document.getElementById('user-blob');
    const triggerBtn = document.getElementById('nex-trigger');
    const closeBtn = document.getElementById('nex-close');

    // Check Browser Support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Your browser does not support Voice Assistant. Please use Google Chrome.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after one command
    recognition.lang = 'en-IN'; // Default to Indian English (understands accents better)
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let isAwake = false; // True only after "Hey NEX"
    let listeningForWakeWord = false;

    // --- SPEAKING FUNCTION (TTS) ---
    function speak(text, callback) {
        // Visuals
        aiBlob.classList.add('talking');
        userBlob.classList.remove('listening');
        statusTitle.innerText = "NEX is speaking...";
        statusSub.innerText = text;

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find a good voice
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

    // --- UI CONTROLS ---
    triggerBtn.addEventListener('click', () => {
        overlay.classList.add('active');
        startListeningMode();
    });

    closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        recognition.stop();
        window.speechSynthesis.cancel();
    });

    // --- LISTENING MODES ---

    // Mode 1: Waiting for "Hey NEX"
    function startListeningMode() {
        isAwake = false;
        listeningForWakeWord = true;
        statusTitle.innerText = "Tell 'Hey NEX'";
        statusSub.innerText = "Listening for wake word...";
        aiBlob.classList.remove('talking');
        userBlob.classList.add('listening'); // User blob glows slightly
        
        try { recognition.start(); } catch(e) {}
    }

    // Mode 2: Waiting for Command (e.g., "Open Deals")
    function activateAssistant() {
        isAwake = true;
        listeningForWakeWord = false;
        
        speak("Hi, how can I help you?", () => {
            statusTitle.innerText = "Listening...";
            statusSub.innerText = "Say a command (e.g., 'Open Deals')";
            userBlob.classList.add('listening'); // Glow user blob
            try { recognition.start(); } catch(e) {}
        });
    }

    // --- RECOGNITION LOGIC ---
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log("Heard:", transcript);

        if (listeningForWakeWord) {
            // Check for variations of "Hey NEX"
            if (transcript.includes('hey nex') || transcript.includes('next') || transcript.includes('hey next') || transcript.includes('an ex')) {
                activateAssistant();
            } else {
                // Wrong wake word, restart listening
                statusSub.innerText = `Heard: "${transcript}". Try 'Hey NEX'`;
                setTimeout(() => { try { recognition.start(); } catch(e) {} }, 1000);
            }
        } 
        else if (isAwake) {
            // Process actual command
            processCommand(transcript);
        }
    };

    recognition.onend = () => {
        // If overlay is open and we haven't processed a command yet, keep listening
        if (overlay.classList.contains('active') && !window.speechSynthesis.speaking) {
            // Add small delay to prevent rapid-fire restart errors
            setTimeout(() => { 
                try { recognition.start(); } catch(e) {} 
            }, 500);
        }
    };

    // --- COMMAND PROCESSOR ---
    function processCommand(command) {
        userBlob.classList.remove('listening');
        
        // Navigation Logic
        if (command.includes('open deals') || command.includes('top deals')) {
            speak("Opening Top Deals page.", () => window.location.href = 'topDeals.html');
        } 
        else if (command.includes('mobile') || command.includes('phone')) {
            speak("Taking you to Mobiles.", () => window.location.href = 'category.html?category=mobile');
        }
        else if (command.includes('laptop') || command.includes('computer')) {
            speak("Showing Laptops.", () => window.location.href = 'category.html?category=laptop');
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
        else if (command.includes('home') || command.includes('index')) {
            speak("Going back home.", () => window.location.href = 'index.html');
        }
        else if (command.includes('search for')) {
            // Extract the search term
            const term = command.replace('search for', '').trim();
            speak(`Searching for ${term}`, () => {
                // Assuming you have search logic, typically redirects to a search page
                // For now, let's just use your existing search input logic if on page, or reload with param
                alert(`Search logic triggered for: ${term}`); // Replace with actual search redirect
            });
        }
        else if (command.includes('hindi')) {
            recognition.lang = 'hi-IN';
            speak("Namaste. Ab main Hindi mein sunungi.");
        }
        else if (command.includes('telugu')) {
            recognition.lang = 'te-IN';
            speak("Namaskaram. Ippudu nenu Telugu vintunnanu.");
        }
        else if (command.includes('english')) {
            recognition.lang = 'en-IN';
            speak("Switched back to English.");
        }
        else {
            speak("I didn't quite catch that. Please try again.", () => {
                isAwake = true; // Stay awake
            });
        }
    }
}