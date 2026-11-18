const textbox = document.getElementById('Textarea');
const replyBox = document.getElementById('ReplyBox');
const statusBox = document.getElementById('Status');
const startButton = document.getElementById('StartButton');
const textInputForm = document.getElementById('TextInputForm');
const textInput = document.getElementById('TextInput');

const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isSpeaking = false;
let shouldListen = false;

function setStatus(message) {
    if (statusBox) statusBox.textContent = message;
}

function normalizeCommand(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function showReplyTyping(text, speed = 30) {
    if (!replyBox) return;

    replyBox.textContent = '';
    let index = 0;
    const timer = window.setInterval(() => {
        replyBox.textContent += text.charAt(index);
        index += 1;
        if (index >= text.length) window.clearInterval(timer);
    }, speed);
}

function restartListening() {
    if (!recognition || !shouldListen || isSpeaking) return;

    window.setTimeout(() => {
        if (shouldListen && !isSpeaking) {
            try {
                recognition.start();
            } catch (error) {
                if (error.name !== 'InvalidStateError') {
                    console.warn('Could not restart microphone:', error);
                }
            }
        }
    }, 250);
}

function speak(text) {
    if (!('speechSynthesis' in window)) {
        if (replyBox) replyBox.textContent = text;
        isSpeaking = false;
        return;
    }

    isSpeaking = true;
    showReplyTyping(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
        isSpeaking = false;
        restartListening();
    };
    utterance.onerror = () => {
        isSpeaking = false;
        restartListening();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}

function processCommand(rawCommand) {
    const command = normalizeCommand(rawCommand);
    if (!textbox) return;

    textbox.textContent = rawCommand.trim();
    if (!command) return;

    if (command === 'hello') {
        recognition?.stop();
        speak('Hello, how can I help you?');
    } else if (command === 'what is your name') {
        recognition?.stop();
        speak('I am a voice chatbot created to assist you.');
    } else if (command === 'what is your purpose') {
        recognition?.stop();
        speak('My purpose is to assist you with your queries and provide information.');
    } else if (command === 'thank you') {
        recognition?.stop();
        speak("You're welcome! If you have any more questions, feel free to ask.");
    } else if (command === 'what is the time') {
        recognition?.stop();
        speak('The current time is ' + new Date().toLocaleTimeString());
    } else if (command === 'what is the date') {
        recognition?.stop();
        speak("Today's date is " + new Date().toLocaleDateString());
    } else if (command === 'stop') {
        shouldListen = false;
        recognition?.stop();
        speak('Goodbye! Have a great day!');
    } else if (command === 'open google') {
        recognition?.stop();
        speak('Opening Google.');
        window.open('https://www.google.com', '_blank', 'noopener');
    } else if (command === 'open youtube') {
        recognition?.stop();
        speak('Opening YouTube.');
        window.open('https://www.youtube.com', '_blank', 'noopener');
    } else if (command === 'open facebook') {
        recognition?.stop();
        speak('Opening Facebook.');
        window.open('https://www.facebook.com', '_blank', 'noopener');
    } else if (command === 'open instagram') {
        recognition?.stop();
        speak('Opening Instagram.');
        window.open('https://www.instagram.com', '_blank', 'noopener');
    } else if (command === 'open anime') {
        recognition?.stop();
        speak('Opening Anime.');
        window.open('https://aniwatchtv.to/home', '_blank', 'noopener');
    }
}

async function requestMicrophonePermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('Microphone permission API is unavailable in this browser.');
        return false;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.error('Microphone permission failed:', error);
        if (window.location.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
            setStatus('Microphone blocked: open this app through an HTTPS address, not plain HTTP.');
        } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setStatus('Microphone permission denied. Allow microphone access in this browser and try again.');
        } else if (error.name === 'NotFoundError') {
            setStatus('No microphone was found on this device.');
        } else {
            setStatus('Could not start the microphone: ' + error.message);
        }
        return false;
    }
}

async function start() {
    if (!SpeechRecognitionApi) {
        setStatus('Voice recognition is not supported by this browser. Use the text box below.');
        return;
    }

    if (!recognition) {
        recognition = new SpeechRecognitionApi();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setStatus('Listening... Speak a command.');
        recognition.onend = () => {
            if (shouldListen && !isSpeaking) {
                setStatus('Listening stopped briefly. Restarting...');
                restartListening();
            }
        };
        recognition.onerror = event => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                shouldListen = false;
                setStatus('Microphone blocked. Allow microphone access, then press Start again.');
            } else if (event.error === 'no-speech') {
                setStatus('No speech detected. Press Start or speak again.');
            } else if (event.error === 'network') {
                shouldListen = false;
                setStatus('Voice recognition network error. This browser may not support online recognition.');
            } else {
                setStatus('Voice recognition error: ' + event.error);
            }
        };
        recognition.onresult = event => {
            const result = event.results[event.resultIndex];
            if (!textbox) return;
            textbox.textContent = result[0].transcript;

            if (result.isFinal) processCommand(result[0].transcript);
        };
    }

    shouldListen = true;
    setStatus('Requesting microphone permission...');
    const allowed = await requestMicrophonePermission();
    if (!allowed) {
        shouldListen = false;
        return;
    }

    try {
        recognition.start();
    } catch (error) {
        if (error.name !== 'InvalidStateError') {
            setStatus('Could not start voice recognition: ' + error.message);
            shouldListen = false;
        }
    }
}

startButton?.addEventListener('click', start);
textInputForm?.addEventListener('submit', event => {
    event.preventDefault();
    processCommand(textInput.value);
    textInput.value = '';
});
