import express from 'express';
import https from 'https';
import cors from 'cors';
const app = express();

// Enable CORS for React frontend
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port for development
    if (origin.includes('localhost')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Chatbot API configuration
const RAPIDAPI_KEY = '436a7f8f36mshbbdca25ff29cd4ap16084djsnce6923387caf';
const API_HOST = 'open-ai21.p.rapidapi.com';

// Function to call chatbot API
function callChatbot(messages) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      hostname: API_HOST,
      port: null,
      path: '/conversationllama',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': API_HOST,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, function (res) {
      const chunks = [];
      
      res.on('data', function (chunk) {
        chunks.push(chunk);
      });

      res.on('end', function () {
        try {
          const body = Buffer.concat(chunks);
          const response = JSON.parse(body.toString());
          console.log('API Response:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify({
      messages: messages,
      web_access: false
    }));

    req.end();
  });
}

// Test endpoint to debug API response
app.get('/api/test', async (req, res) => {
  try {
    const testMessages = [{ role: 'user', content: 'Hello, how are you?' }];
    const response = await callChatbot(testMessages);
    
    res.json({
      success: true,
      rawResponse: response,
      extractedMessage: response.response || response.message || response.content || 'No message found'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversation = [] } = req.body;
    
    // Add user message to conversation
    const messages = [...conversation, { role: 'user', content: message }];
    
    // Call chatbot API
    const response = await callChatbot(messages);
    
    res.json({
      success: true,
      response: response,
      conversation: messages
    });
  } catch (error) {
    console.error('Chatbot API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chatbot response'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chatbot API is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Chatbot API server running on port ${PORT}`);
});

export default app;
