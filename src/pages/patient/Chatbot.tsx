import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useChatbotMessages, useSendChatbotMessage, ChatbotMessage } from "@/hooks/useChatbot";
import { useToast } from "@/components/ui/use-toast";

// Predefined bot responses for demo
const PREDEFINED_RESPONSES = [
  {
    keywords: ["hello", "hi", "hey"],
    response: "Hello! I'm your mental health assistant. How are you feeling today?",
  },
  {
    keywords: ["stressed", "stress", "overwhelmed", "pressure"],
    response: "I understand that construction work can be stressful. Have you tried any relaxation techniques? Deep breathing for 5 minutes can help reduce stress hormones in your body.",
  },
  {
    keywords: ["anxiety", "anxious", "worried", "panic"],
    response: "Anxiety is common in high-pressure jobs. When you notice anxious thoughts, try the 5-4-3-2-1 technique: acknowledge 5 things you see, 4 things you can touch, 3 things you hear, 2 things you smell, and 1 thing you taste.",
  },
  {
    keywords: ["sad", "depressed", "depression", "unhappy", "low"],
    response: "I'm sorry to hear you're feeling down. Depression is a serious condition that affects many in the construction industry. Small activities like a brief walk or calling a friend can help. Would you like me to suggest some resources?",
  },
  {
    keywords: ["sleep", "insomnia", "tired", "exhausted", "fatigue"],
    response: "Sleep problems can significantly impact mental health. Try establishing a regular sleep schedule, even on weekends. Reduce screen time before bed and consider creating a relaxing bedtime routine.",
  },
  {
    keywords: ["work", "job", "site", "construction", "boss", "colleague"],
    response: "Construction work brings unique challenges. The physical demands combined with tight deadlines can affect your wellbeing. Remember that taking breaks is essential, not a weakness.",
  },
  {
    keywords: ["help", "resources", "support", "therapy", "therapist"],
    response: "It's great that you're seeking support. The Construction Industry Helpline offers 24/7 support at 0345 605 1956. Would you also like to explore our therapist directory?",
  },
  {
    keywords: ["thank", "thanks"],
    response: "You're welcome! Remember, seeking support shows strength, not weakness. I'm here whenever you need to talk.",
  },
];

// Default responses when no keyword matches
const DEFAULT_RESPONSES = [
  "I'm here to support you. Could you tell me more about what you're experiencing?",
  "That's important to address. Have you spoken with anyone else about this?",
  "I understand this is challenging. Small steps toward self-care can make a difference.",
  "Your wellbeing matters. The construction industry has specific resources for mental health support.",
  "It takes courage to discuss these things. Would connecting with a professional therapist help?",
];

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function PatientChatbot() {
  const { user, profile } = useAuth();
  const { data: chatbotMessages, isLoading } = useChatbotMessages();
  const { mutate: sendMessage } = useSendChatbotMessage();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize Vapi Assistant on component mount
  useEffect(() => {
    // Define Vapi configuration
    const assistant = "57685c34-7f80-4ccc-815f-588273ae0fdd";
    const apiKey = "3992e71c-aa00-4971-8f14-56266e86b0d7";
    
    // Improved button configuration - setting injectButton to false to hide the floating button
    const buttonConfig = {
      position: "bottom-right", 
      offset: "130px",
      width: "40px",
      height: "40px",
      injectButton: false, // Don't show the floating button
      idle: {
        color: `rgba(36, 36, 36, 0.6)`,
        type: "round",
        icon: `https://unpkg.com/lucide-static@0.321.0/icons/phone.svg`,
      },
      loading: {
        color: `rgba(36, 36, 36, 0.6)`,
        type: "round",
        icon: `https://unpkg.com/lucide-static@0.321.0/icons/loader-2.svg`,
      },
      active: {
        color: `rgba(179, 38, 30, 0.8)`,
        type: "round",
        icon: `https://unpkg.com/lucide-static@0.321.0/icons/phone-off.svg`,
      },
    };

    // Add Vapi script dynamically
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js";
    script.defer = true;
    script.async = true;
    document.body.appendChild(script);
    
    // Add custom styles for Vapi button to truly integrate with the theme
    const style = document.createElement('style');
    style.textContent = `
      .vapi-btn {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
        transition: all 0.3s ease !important;
        z-index: 40 !important; /* Lower z-index so it doesn't cover important elements */
        opacity: 0.5 !important; /* More transparent by default */
        border: 1px solid rgba(255, 255, 255, 0.1) !important; /* Subtle border */
      }
      .vapi-btn:hover {
        transform: scale(1.05) !important;
        opacity: 0.85 !important; /* More visible on hover */
      }
      .vapi-btn-round {
        border-radius: 50% !important; /* Ensure perfect circle */
      }
      .vapi-btn-is-idle {
        background: rgba(36, 36, 36, 0.6) !important; /* Dark background with transparency */
      }
      .vapi-btn-is-idle svg path {
        stroke: rgba(255, 255, 255, 0.8) !important; /* White phone icon */
      }
      .vapi-btn-is-speaking {
        animation: subtle-pulse 2s infinite !important;
      }
      @keyframes subtle-pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(50, 50, 50, 0.3);
        }
        70% {
          box-shadow: 0 0 0 6px rgba(50, 50, 50, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(50, 50, 50, 0);
        }
      }
      
      /* Hide button on mobile when it might overlap with important elements */
      @media (max-width: 640px) {
        .vapi-btn {
          bottom: 80px !important;
          right: 20px !important;
          transform: scale(0.85) !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Initialize Vapi once script is loaded
    script.onload = function() {
      if (window.vapiSDK) {
        window.vapiInstance = window.vapiSDK.run({
          apiKey: apiKey,
          assistant: assistant,
          config: buttonConfig,
        });
      }
    };

    // Clean up when component unmounts
    return () => {
      try {
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
        if (style && style.parentNode) {
          style.parentNode.removeChild(style);
        }
      } catch (error) {
        console.error("Error cleaning up Vapi elements:", error);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatbotMessages, isTyping]);

  // Format our Supabase messages for display
  const formatMessages = (): Message[] => {
    if (!chatbotMessages || chatbotMessages.length === 0) {
      // Return a welcome message when there's no history
      return [
        {
          id: "welcome",
          text: "Hi there! I'm your mental health assistant powered by Google's Gemini AI. I'm here to provide support and listen. How are you feeling today?",
          sender: "bot",
          timestamp: new Date(),
        },
      ];
    }

    return chatbotMessages.flatMap((msg: ChatbotMessage) => {
      const messages: Message[] = [
        {
          id: `user-${msg.id}`,
          text: msg.user_message,
          sender: "user",
          timestamp: new Date(msg.created_at),
        }
      ];

      if (msg.bot_response) {
        messages.push({
          id: `bot-${msg.id}`,
          text: msg.bot_response,
          sender: "bot",
          timestamp: new Date(msg.created_at),
        });
      }

      return messages;
    });
  };

  const handleSendMessage = () => {
    if (input.trim() === "") return;
    
    // Simulate bot typing immediately
    setIsTyping(true);
    
    // Send message to Supabase and get Gemini AI response
    sendMessage(input.trim(), {
      onSuccess: () => {
        setInput("");
        // Keep typing state for a moment to simulate natural conversation flow
        setTimeout(() => {
          setIsTyping(false);
        }, 500);
      },
      onError: () => {
        setIsTyping(false);
        toast({
          title: "Error",
          description: "Failed to get AI response. Please try again.",
          duration: 3000,
        });
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Show loading state when fetching messages
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center">
          <div className="mindful-loader mb-4"></div>
          <p className="text-foreground">Loading conversation history...</p>
        </div>
      </DashboardLayout>
    );
  }

  const messages = formatMessages();

  return (
    <DashboardLayout>
      <div className="p-6 h-[calc(100vh-3.5rem)] flex flex-col">
        <PageTitle title="Mental Health Assistant" subtitle="Chat with our AI assistant about your feelings and concerns" />
        
        <Card className="flex-1 flex flex-col mt-6 overflow-hidden bg-black/40 backdrop-blur-sm border-border">
          <CardContent className="flex-1 flex flex-col p-4 h-full">
            <div className="flex-1 overflow-y-auto mb-4 pr-2 custom-scrollbar space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex items-start max-w-[75%] gap-2 ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
                      <Avatar className="h-8 w-8 mt-0.5">
                        {message.sender === "user" ? (
                          <>
                            <AvatarImage src={profile?.avatar_url} alt="User" />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {profile?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </>
                        ) : (
                          <>
                            <AvatarImage src="/bot-avatar.png" alt="Bot" />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              AI
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start max-w-[75%] gap-2">
                      <Avatar className="h-8 w-8 mt-0.5">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          AI
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-2xl px-4 py-2 bg-secondary text-secondary-foreground">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="h-2 w-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="h-2 w-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                        <p className="text-xs opacity-70 mt-1">AI thinking...</p>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </AnimatePresence>
            </div>
            
            <div className="flex flex-col space-y-3">
              <div className="flex gap-2 items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="bg-black/50"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={input.trim() === "" || isTyping}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70 transition-all duration-300 border-white/10"
                  onClick={() => {
                    toast({
                      title: "Voice Assistant",
                      description: "Starting voice chat...",
                      duration: 2000,
                    });
                    // Try to programmatically start a voice call
                    if (window.vapiInstance && window.vapiInstance.startCall) {
                      window.vapiInstance.startCall();
                    } else if (window.vapiSDK && window.vapiSDK.startCall) {
                      window.vapiSDK.startCall();
                    } else {
                      console.log("Attempting to start Vapi call using alternate methods");
                      // Fallback: Try to find and trigger the Vapi button if it exists
                      const vapiBtn = document.querySelector('.vapi-btn');
                      if (vapiBtn) {
                        (vapiBtn as HTMLElement).click();
                      } else {
                        // Show a more detailed error
                        toast({
                          title: "Voice Assistant",
                          description: "Could not initialize voice chat. Please refresh and try again.",
                          duration: 3000,
                        });
                      }
                    }
                  }}
                >
                  <Phone className="h-4 w-4 text-white/80" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground/70 text-center">
                Click the phone icon to start a voice conversation
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Add TypeScript declaration for the Vapi SDK
declare global {
  interface Window {
    vapiSDK: {
      run: (config: {
        apiKey: string;
        assistant: string;
        config: any;
      }) => any;
    };
    vapiInstance: any;
  }
}
