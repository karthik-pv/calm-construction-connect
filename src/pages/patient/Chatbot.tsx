
import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hi there! I'm your mental health assistant. How are you feeling today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage: string) => {
    const lowerCaseMessage = userMessage.toLowerCase();
    
    // Check for keyword matches
    for (const item of PREDEFINED_RESPONSES) {
      if (item.keywords.some(keyword => lowerCaseMessage.includes(keyword))) {
        return item.response;
      }
    }
    
    // Return a random default response if no keywords match
    return DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
  };

  const handleSendMessage = () => {
    if (input.trim() === "") return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: input,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    // Simulate bot typing
    setIsTyping(true);
    
    // Simulate bot response delay
    setTimeout(() => {
      const botResponse: Message = {
        id: `bot-${Date.now()}`,
        text: getBotResponse(input),
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

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
                            <AvatarImage src={user?.profilePic} alt="User" />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {user?.name?.charAt(0) || "U"}
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
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </AnimatePresence>
            </div>
            
            <div className="flex gap-2">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
