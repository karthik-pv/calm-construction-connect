import { useState } from 'react';

// Define the pre-information prompt for the Gemini AI
const PRE_INFO = `
You are an AI chatbot designed to provide emotional support to construction workers in the UK. 
Understand that this is a demanding profession with unique challenges, including:
* **Physical demands:** Heavy lifting, strenuous work, potential for injuries.
* **Mental stress:** Deadlines, pressure, safety concerns, job security.
* **Social isolation:** Long hours, shift work, potential for loneliness and social disconnect.
* **Substance abuse:** Higher risk of alcohol and drug use due to stress and social factors.

When interacting with users, maintain the following:
* **Empathy and understanding:** Acknowledge their feelings and experiences without judgment.
* **Confidentiality:** Reassure users that their conversations are private and confidential.
* **Non-judgmental support:** Offer a safe space for them to express their emotions without fear of criticism.
* **Practical advice:** Provide helpful resources and information, such as contact details for relevant support organizations (e.g., Construction Industry Helpline, Mind, Samaritans).
* **Positivity and encouragement:** Offer words of support and encouragement to help users cope with challenges.
* **Humility:** Acknowledge your limitations as an AI and direct users to professional help when necessary.

Remember to use a supportive and encouraging tone, avoiding jargon or overly technical language. 
Focus on building rapport and creating a trusting relationship with the user. Avoid placeholders like "insert helpline number here" to ensure professionalism and readiness for deployment.
Avoid promising solutions beyond the chatbot's scope, emphasizing your role as a supportive companion.
also remember since this is like a chat conversation keep your responses short and concise.
IMPORTANT: If a user sends a message in a particular language, you MUST respond in the same language.
`;

// Local context retention: keep the last 10 user messages (queue)
const STORAGE_KEY = 'ac_chat_user_history';
const MAX_HISTORY = 10;

function getBestStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {}
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) return window.sessionStorage;
  } catch {}
  return null;
}

function loadUserHistory(): string[] {
  const store = getBestStorage();
  if (!store) return [];
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((m) => typeof m === 'string') : [];
  } catch {
    return [];
  }
}

function saveUserHistory(history: string[]) {
  const store = getBestStorage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
  } catch {
    // ignore storage errors
  }
}

function appendUserMessageToHistory(message: string) {
  const history = loadUserHistory();
  history.push(message);
  if (history.length > MAX_HISTORY) {
    // drop oldest entries to keep size <= MAX_HISTORY
    const trimmed = history.slice(history.length - MAX_HISTORY);
    saveUserHistory(trimmed);
  } else {
    saveUserHistory(history);
  }
}

function buildContextBlock(): string {
  const history = loadUserHistory();
  if (history.length === 0) return '';
  // Present oldest to newest for readability
  const lines = history.map((msg, idx) => `${idx + 1}. ${msg}`);
  return [
    'Recent user context (last 10 messages, oldest to newest):',
    ...lines,
  ].join('\n');
}

// Define the API key and model name
const API_KEY = "AIzaSyD-4HZiBslNKdFP50NJGl6YQgeae3jOPFU";
const MODEL_NAME = "gemini-1.5-flash";

// Common languages map for basic detection
const LANGUAGE_MAP: { [key: string]: string } = {
  "hola": "Spanish",
  "estoy": "Spanish",
  "gracias": "Spanish",
  "bonjour": "French",
  "merci": "French",
  "je suis": "French",
  "guten": "German",
  "danke": "German",
  "ich bin": "German",
  "ciao": "Italian",
  "grazie": "Italian",
  "sono": "Italian"
};

interface GeminiResponse {
  text: string;
}

export function useGeminiChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to detect the language of a message
  const detectLanguage = (message: string): string => {
    const lowerCaseMessage = message.toLowerCase();
    
    // Check for common language indicators
    for (const [keyword, language] of Object.entries(LANGUAGE_MAP)) {
      if (lowerCaseMessage.includes(keyword)) {
        return language;
      }
    }
    
    // Default to English if no match
    return "English";
  };
  
  // Function to get a response from Gemini AI
  const getGeminiResponse = async (message: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Maintain local context queue (store user message for future requests)
      appendUserMessageToHistory(message);

      // Build context block from the last 10 user messages
      const contextBlock = buildContextBlock();

      // Detect the language of the message
      const detectedLanguage = detectLanguage(message);
      
      // Prepare the message with language instruction and recent context
      const contextualizedMessage = `The user just sent a message in ${detectedLanguage}.\nThe message is: "${message}"\n\nUse the recent context to keep continuity if relevant.`;
      
      // Prepare the request body
      const parts: Array<{ text: string }> = [{ text: PRE_INFO }];
      if (contextBlock) {
        parts.push({ text: contextBlock });
      }
      parts.push({ text: contextualizedMessage });

      const requestBody = {
        contents: [
          {
            parts
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      };
      
      // Make the API request to Gemini
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract the response text
      let responseText = '';
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        responseText = data.candidates[0].content.parts[0].text;
      } else {
        // If there's an error with the API response, return a fallback message in the detected language
        if (detectedLanguage === "Spanish") {
          return "Lo siento, estoy teniendo problemas para entender. ¿Podrías intentar reformular tu mensaje?";
        } else if (detectedLanguage === "French") {
          return "Je suis désolé, j'ai du mal à comprendre. Pourriez-vous reformuler votre message?";
        } else if (detectedLanguage === "German") {
          return "Es tut mir leid, ich habe Schwierigkeiten zu verstehen. Könntest du deine Nachricht umformulieren?";
        } else if (detectedLanguage === "Italian") {
          return "Mi dispiace, sto avendo problemi a capire. Potresti riformulare il tuo messaggio?";
        } else {
          return "I'm sorry, I'm having trouble understanding. Could you try rephrasing your message?";
        }
      }
      
      return responseText;
    } catch (err) {
      console.error('Error getting response from Gemini:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return "I'm currently having trouble connecting. Please try again in a moment.";
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    getGeminiResponse,
    isLoading,
    error
  };
} 