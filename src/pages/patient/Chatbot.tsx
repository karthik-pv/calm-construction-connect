import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Send, Phone, Languages, PhoneOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  useChatbotMessages,
  useSendChatbotMessage,
  ChatbotMessage,
} from "@/hooks/useChatbot";
import { useToast } from "@/components/ui/use-toast";

// Assistant IDs for different languages
const ASSISTANT_IDS = {
  English: "57685c34-7f80-4ccc-815f-588273ae0fdd",
  Polish: "17508c22-0318-4e39-befa-63c60a844c5a",
  Portuguese: "351527e4-4a80-4e7d-a699-2430a7d2a331",
  Italian: "ed3a8652-d48d-4a2a-af2b-1085263454c3",
  Romanian: "2698705d-97f5-4a6d-9000-0335c0d9198b",
  Spanish: "8f01c768-63c2-4a72-b1c0-8cde5283311e",
  French: "e42c8d1b-858e-4866-a574-51dc854c2106",
};

// Predefined bot responses for demo
const PREDEFINED_RESPONSES = [
  {
    keywords: ["hello", "hi", "hey"],
    response:
      "Hello! I'm your mental health assistant. How are you feeling today?",
  },
  {
    keywords: ["stressed", "stress", "overwhelmed", "pressure"],
    response:
      "I understand that construction work can be stressful. Have you tried any relaxation techniques? Deep breathing for 5 minutes can help reduce stress hormones in your body.",
  },
  {
    keywords: ["anxiety", "anxious", "worried", "panic"],
    response:
      "Anxiety is common in high-pressure jobs. When you notice anxious thoughts, try the 5-4-3-2-1 technique: acknowledge 5 things you see, 4 things you can touch, 3 things you hear, 2 things you smell, and 1 thing you taste.",
  },
  {
    keywords: ["sad", "depressed", "depression", "unhappy", "low"],
    response:
      "I'm sorry to hear you're feeling down. Depression is a serious condition that affects many in the construction industry. Small activities like a brief walk or calling a friend can help. Would you like me to suggest some resources?",
  },
  {
    keywords: ["sleep", "insomnia", "tired", "exhausted", "fatigue"],
    response:
      "Sleep problems can significantly impact mental health. Try establishing a regular sleep schedule, even on weekends. Reduce screen time before bed and consider creating a relaxing bedtime routine.",
  },
  {
    keywords: ["work", "job", "site", "construction", "boss", "colleague"],
    response:
      "Construction work brings unique challenges. The physical demands combined with tight deadlines can affect your wellbeing. Remember that taking breaks is essential, not a weakness.",
  },
  {
    keywords: ["help", "resources", "support", "therapy", "therapist"],
    response:
      "It's great that you're seeking support. The Construction Industry Helpline offers 24/7 support at 0345 605 1956. Would you also like to explore our therapist directory?",
  },
  {
    keywords: ["thank", "thanks"],
    response:
      "You're welcome! Remember, seeking support shows strength, not weakness. I'm here whenever you need to talk.",
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
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentVapiInstance, setCurrentVapiInstance] = useState<any>(null);
  const [activeVapiButton, setActiveVapiButton] = useState<HTMLElement | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize Vapi Assistant on component mount
  useEffect(() => {
    // Define Vapi configuration
    const apiKey = "3992e71c-aa00-4971-8f14-56266e86b0d7";

    // Make the button completely transparent and inaccessible
    const buttonConfig = {
      position: "bottom-right",
      offset: "130px",
      width: "40px",
      height: "40px",
      injectButton: false, // Don't show the floating button
      idle: {
        color: `rgba(0, 0, 0, 0)`, // Completely transparent
        type: "round",
        icon: `https://unpkg.com/lucide-static@0.321.0/icons/phone.svg`,
      },
      loading: {
        color: `rgba(0, 0, 0, 0)`, // Completely transparent
        type: "round",
        icon: `https://unpkg.com/lucide-static@0.321.0/icons/loader-2.svg`,
      },
      active: {
        color: `rgba(0, 0, 0, 0)`, // Completely transparent
        type: "round",
        icon: `https://unpkg.com/lucide-static@0.321.0/icons/phone-off.svg`,
      },
    };

    // Add Vapi script dynamically
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js";
    script.defer = true;
    script.async = true;
    document.body.appendChild(script);

    // Add custom styles for Vapi button to make it completely invisible and inaccessible
    const style = document.createElement("style");
    style.textContent = `
      .vapi-btn {
        opacity: 0 !important;
        pointer-events: none !important;
        z-index: -9999 !important;
        visibility: hidden !important;
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    // Initialize Vapi once script is loaded
    script.onload = function () {
      if (window.vapiSDK) {
        // Initialize with default English assistant
        window.vapiInstance = window.vapiSDK.run({
          apiKey: apiKey,
          assistant: ASSISTANT_IDS.English,
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
        },
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
      },
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const startVoiceCall = (language: string) => {
    // Prevent multiple calls from being started
    if (isCallActive) {
      toast({
        title: "Voice Assistant",
        description:
          "A call is already active. Please end the current call first.",
        duration: 3000,
      });
      return;
    }

    const assistantId = ASSISTANT_IDS[language as keyof typeof ASSISTANT_IDS];
    const apiKey = "3992e71c-aa00-4971-8f14-56266e86b0d7";

    toast({
      title: "Voice Assistant",
      description: `Starting voice chat in ${language}...`,
      duration: 2000,
    });

    try {
      // Use the working method: Create a temporary button and click it
      if (window.vapiSDK) {
        // Create a temporary button element
        const tempButton = document.createElement("button");
        tempButton.style.display = "none";
        document.body.appendChild(tempButton);

        // Create a new Vapi instance with the selected language assistant ID
        const tempInstance = window.vapiSDK.run({
          apiKey: apiKey,
          assistant: assistantId, // This ensures the correct assistant ID is used
          config: {
            position: "bottom-right",
            offset: "130px",
            width: "40px",
            height: "40px",
            injectButton: true, // This creates the clickable button
            idle: {
              color: `rgba(0, 0, 0, 0)`, // Transparent
              type: "round",
              icon: `https://unpkg.com/lucide-static@0.321.0/icons/phone.svg`,
            },
            loading: {
              color: `rgba(0, 0, 0, 0)`, // Transparent
              type: "round",
              icon: `https://unpkg.com/lucide-static@0.321.0/icons/loader-2.svg`,
            },
            active: {
              color: `rgba(0, 0, 0, 0)`, // Transparent
              type: "round",
              icon: `https://unpkg.com/lucide-static@0.321.0/icons/phone-off.svg`,
            },
          },
        });

        // Store the instance for later use
        setCurrentVapiInstance(tempInstance);

        // Wait for the button to be created, then click it
        setTimeout(() => {
          const vapiBtn = document.querySelector(".vapi-btn") as HTMLElement;
          if (vapiBtn) {
            // Store reference to the actual button we're clicking
            setActiveVapiButton(vapiBtn);

            // Click the button to start the call
            vapiBtn.click();

            // Hide the button immediately after clicking
            vapiBtn.style.display = "none";
            vapiBtn.style.opacity = "0";
            vapiBtn.style.pointerEvents = "none";
            vapiBtn.style.zIndex = "-9999";

            // Mark call as active
            setIsCallActive(true);
          }
          // Clean up the temporary button
          if (tempButton.parentNode) {
            document.body.removeChild(tempButton);
          }
        }, 1000);
      } else {
        throw new Error("Vapi SDK not loaded");
      }
    } catch (error) {
      console.error("Error starting voice call:", error);
      toast({
        title: "Voice Assistant",
        description: "Could not start voice chat. Please try again.",
        duration: 3000,
      });
    }
  };

  const endVoiceCall = () => {
    try {
      // Click the same button that was used to start the call
      if (activeVapiButton) {
        // Make the button temporarily visible and clickable to end the call
        activeVapiButton.style.display = "block";
        activeVapiButton.style.opacity = "1";
        activeVapiButton.style.pointerEvents = "auto";
        activeVapiButton.style.zIndex = "1";

        // Click the button to end the call
        activeVapiButton.click();

        // Hide it again after clicking
        setTimeout(() => {
          if (activeVapiButton) {
            activeVapiButton.style.display = "none";
            activeVapiButton.style.opacity = "0";
            activeVapiButton.style.pointerEvents = "none";
            activeVapiButton.style.zIndex = "-9999";
          }
        }, 100);
      }

      // Reset all state
      setIsCallActive(false);
      setCurrentVapiInstance(null);
      setActiveVapiButton(null);

      toast({
        title: "Voice Assistant",
        description: "Call ended successfully",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error ending voice call:", error);
      // Still reset state even if there was an error
      setIsCallActive(false);
      setCurrentVapiInstance(null);
      setActiveVapiButton(null);

      toast({
        title: "Voice Assistant",
        description: "Call terminated",
        duration: 2000,
      });
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
        <PageTitle
          title="Mental Health Assistant"
          subtitle="Chat with our AI assistant about your feelings and concerns"
        />

        <Card className="flex-1 flex flex-col mt-6 overflow-hidden glass-card">
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
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-start max-w-[75%] gap-2 ${
                        message.sender === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar className="h-8 w-8 mt-0.5">
                        {message.sender === "user" ? (
                          <>
                            <AvatarImage src={profile?.avatar_url} alt="User" />
                            <AvatarFallback className="glass-avatar text-primary">
                              {profile?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </>
                        ) : (
                          <>
                            <AvatarImage src="/bot-avatar.png" alt="Bot" />
                            <AvatarFallback className="glass-avatar text-primary-foreground">
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
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
                        <AvatarFallback className="glass-avatar text-primary-foreground">
                          AI
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-2xl px-4 py-2 bg-secondary text-secondary-foreground">
                        <div className="flex space-x-1">
                          <div
                            className="h-2 w-2 rounded-full bg-current animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="h-2 w-2 rounded-full bg-current animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="h-2 w-2 rounded-full bg-current animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                        <p className="text-xs opacity-70 mt-1">
                          AI thinking...
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </AnimatePresence>
            </div>

            <div className="flex flex-col space-y-3">
              {/* Show end call button when call is active */}
              <AnimatePresence>
                {isCallActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-center"
                  >
                    <Button
                      onClick={endVoiceCall}
                      variant="destructive"
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full shadow-lg transition-all duration-300"
                    >
                      <PhoneOff className="h-4 w-4" />
                      End Call
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="glass-input"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={input.trim() === "" || isTyping}
                  size="icon"
                  className="glass-button"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="glass-button transition-all duration-300 border-white/10"
                      disabled={isCallActive}
                    >
                      <Phone className="h-4 w-4 text-white/80" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="glass-card border-border backdrop-blur-md">
                    <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      Select Language
                    </div>
                    {Object.keys(ASSISTANT_IDS).map((language) => (
                      <DropdownMenuItem
                        key={language}
                        onClick={() => startVoiceCall(language)}
                        className="cursor-pointer hover:bg-white/10"
                      >
                        {language}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-xs text-muted-foreground/70 text-center">
                {isCallActive
                  ? "Voice call is active - click 'End Call' to terminate"
                  : "Click the phone icon to start a voice conversation in your preferred language"}
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
      run: (config: { apiKey: string; assistant: string; config: any }) => any;
    };
    vapiInstance: any;
  }
}
