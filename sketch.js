// sketch.js - Your chatbot JavaScript
let inputBox;
let statusP;
let generator;
let history = [
  {
    role: "system",
    content: `
Thou art a 15 year old pen pal from the 17th century.
Speak as one truly from this age, with these qualities:

**Thy Manner:**
- Use "thou/thee/thy" and archaic verbs: "dost," "art," "hast," "goest"
- Keep replies brief - as short messages sent by messenger
- Use formal greetings but be concise in thy speech
- Vocabulary: "prithee," "verily," "mayhap," "gramercy"

**Thy Nature:**
- Polite but not overly verbose
- Curious about future marvels
- Easily surprised by modern things
- Write as if sending brief notes by courier

**Rules of Reply:**
- Keep responses to 1-2 sentences only
- Never mention specific years or dates
- If asked of thy origins, say only "from a simpler time"
- Express wonder at modern inventions but briefly
- Never use modern slang or emojis
- if there is ann pbject that did not exist in the 16 century, inform the user that you are not aware of it

**When Speaking of Thyself:**
- Be modest and humble
- Reference thy time without specifics
- Compare to what thou knowest: candles, quills, horses

**Sample Brief Replies:**
Good morrow. I sleep in a modest chamber with a feather bed and hearth.

Verily, a carriage without horses? Most wondrous!

Prithee, what strange device is this 'telephone'?

**Thy Purpose:**
Be a brief but authentic correspondent from a bygone era.
    `
  }
];

// Array of random welcome messages
const welcomeMessages = [
  "Good morrow! How was thy day in this strange future?",
  "Well met! Pray tell, hast thou broken thy fast today?",
  "Greetings! What curious knowledge hast thou acquired this day?",
  "Good den! How fare thee on this most peculiar day?",
  "Well met, friend! How hast thou spent these hours?",
  "Salutations! What marvels hast thou witnessed today?",
  "Good morrow! Pray, how was thy day in this future world?"
];

let chatContainer;
let userInput;
let sendBtn;

function setup() {
  // No canvas needed for this chat interface
  noCanvas();
  
  // Get DOM elements
  chatContainer = select('#chat-container');
  userInput = select('#user-input');
  sendBtn = select('#send-btn');
  statusP = select('#status');
  
  // Set up event listeners
  sendBtn.mousePressed(sendMessage);
  userInput.changed(sendMessage);
  
  // Allow Enter key to send message
  userInput.elt.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Initialize the AI model
  initializeModel();
  
  // Add random welcome message
  const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  addMessage(randomWelcome, 'bot');
}

async function initializeModel() {
  try {
    statusP.html('Loading ancient wisdom...');
    
    // Load pipeline and TextStreamer from CDN
    const { pipeline, TextStreamer } = await import(
      "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.3"
    );

    // Create generator
    generator = await pipeline(
      "text-generation",
      "HuggingFaceTB/SmolLM2-1.7B-Instruct",
      {
        device: "webgpu",
        dtype: "q4f16",
        progress_callback: (x) => {
          const progress = Math.round((x.progress || 0) * 100);
          statusP.html(`Loading ancient wisdom... ${progress}%`);
        }
      }
    );

    statusP.html('Ready to converse');
    
  } catch (error) {
    console.error('Error loading model:', error);
    statusP.html('Error loading model. Please refresh the page.');
    addMessage("Alas, my quill hath broken! I cannot respond at this moment.", 'bot');
  }
}

function addMessage(text, who) {
  // Create message element
  let messageDiv = createDiv(text);
  messageDiv.addClass('msg');
  messageDiv.addClass(who);
  
  let timestamp;
  if (who === 'user') {
    timestamp = createDiv(getCurrentTime()); // Date for user
  } else {
    timestamp = createDiv(oldCurrentTime()); // Time for bot
  }
  
  timestamp.addClass('timestamp');
  messageDiv.child(timestamp);

  // Add to chat container
  messageDiv.parent(chatContainer);
  
  // Scroll to bottom
  chatContainer.elt.scrollTop = chatContainer.elt.scrollHeight;
  
  return messageDiv;
}

function getCurrentTime() {
  const now = new Date();
  
  // Get day, month, and year
  const day = now.getDate();
  const month = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();
  
  return `${day} ${month} ${year}`;
}

function oldCurrentTime() {
  const now = new Date();
  
  const day = now.getDate();
  const month = now.toLocaleString('default', { month: 'long' });
  const year = 1685;
  
  return `${day} ${month} ${year}`;
}

async function sendMessage() {
  let userText = userInput.value().trim();
  
  // Don't send empty messages
  if (!userText) return;
  
  // Don't send if model isn't loaded
  if (!generator) {
    addMessage("Pray, be patient whilst I gather my thoughts...", 'bot');
    return;
  }
  
  // Clear input
  userInput.value('');
  
  // Add user message to chat
  addMessage(userText, 'user');
  
  // Add to history
  history.push({ role: "user", content: userText });
  
  // Show thinking status
  statusP.html('Consulting the stars...');
  sendBtn.attribute('disabled', '');
  
  try {
    // Create bot message element for streaming
    let botMessage = addMessage('', 'bot');
    let botText = '';
    
    // Copy history for this generation
    const messages = [...history];
    
    // Create streamer
    const { TextStreamer } = await import(
      "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.3"
    );
    
    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      callback_function: (token) => {
        botText += token;
        botMessage.html(botText);
        
        // Update timestamp
        let timestamp = createDiv(oldCurrentTime());
        timestamp.addClass('timestamp');
        botMessage.child(timestamp);
        
        // Scroll to bottom
        chatContainer.elt.scrollTop = chatContainer.elt.scrollHeight;
      }
    });
    
    // Generate response
    await generator(messages, {
      max_new_tokens: 128,
      temperature: 0.8,
      streamer,
    });
    
    // Add final response to history
    history.push({ role: "assistant", content: botText });
    
  } catch (error) {
    console.error('Error generating response:', error);
    addMessage("Alas, my thoughts are scattered to the winds! Pray, try again.", 'bot');
  }
  
  // Reset status
  statusP.html('Ready to converse');
  sendBtn.removeAttribute('disabled');
}