
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Clock, MoreVertical, Phone, Video, Image } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// Demo data for chat conversations
const patients = [
  {
    id: "patient-1",
    name: "John Builder",
    profilePic: "https://i.pravatar.cc/150?img=1",
    lastMessage: "I've been having trouble sleeping lately due to job stress.",
    lastMessageTime: "10:45 AM",
    online: true,
    unreadCount: 1,
    tags: ["Anxiety", "Sleep Issues"],
    notes: "Reports work-related stress affecting sleep pattern."
  },
  {
    id: "patient-2",
    name: "Rob Wilson",
    profilePic: "https://i.pravatar.cc/150?img=3",
    lastMessage: "The mindfulness exercises have been really helpful, thank you.",
    lastMessageTime: "Yesterday",
    online: false,
    unreadCount: 0,
    tags: ["Depression", "Anxiety"],
    notes: "Making good progress with mindfulness techniques."
  },
  {
    id: "patient-3",
    name: "Mark Johnson",
    profilePic: "https://i.pravatar.cc/150?img=4",
    lastMessage: "When can we schedule our next session?",
    lastMessageTime: "Tuesday",
    online: true,
    unreadCount: 0,
    tags: ["PTSD", "Anger Management"],
    notes: "Needs regular check-ins. Displaying improvement in coping mechanisms."
  },
];

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
  type: "text" | "image";
  imageUrl?: string;
}

// Demo message data
const getDemoMessages = (patientId: string): Message[] => {
  if (patientId === "patient-1") {
    return [
      {
        id: "1",
        content: "Hello John, how are you feeling today?",
        senderId: "1",
        receiverId: "patient-1",
        timestamp: new Date(new Date().getTime() - 60 * 60000),
        status: "read",
        type: "text",
      },
      {
        id: "2",
        content: "I've been having trouble sleeping lately due to job stress.",
        senderId: "patient-1",
        receiverId: "1",
        timestamp: new Date(new Date().getTime() - 55 * 60000),
        status: "read",
        type: "text",
      },
      {
        id: "3",
        content: "I understand. Construction work can be physically and mentally demanding. Have you been practicing the relaxation techniques we discussed?",
        senderId: "1",
        receiverId: "patient-1",
        timestamp: new Date(new Date().getTime() - 50 * 60000),
        status: "read",
        type: "text",
      },
      {
        id: "4",
        content: "I tried the deep breathing exercises, but I find it hard to stay consistent.",
        senderId: "patient-1",
        receiverId: "1",
        timestamp: new Date(new Date().getTime() - 45 * 60000),
        status: "read",
        type: "text",
      },
      {
        id: "5",
        content: "That's completely normal. Small, consistent steps are key. Have you tried setting a specific time each day for practice?",
        senderId: "1",
        receiverId: "patient-1",
        timestamp: new Date(new Date().getTime() - 44 * 60000),
        status: "read",
        type: "text",
      },
      {
        id: "6",
        content: "I've attached a PDF guide with simple exercises you can do even at the construction site during breaks.",
        senderId: "1",
        receiverId: "patient-1",
        timestamp: new Date(new Date().getTime() - 30 * 60000),
        status: "read",
        type: "image",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&auto=format",
      },
      {
        id: "7",
        content: "Thank you, I'll try to review this today.",
        senderId: "patient-1",
        receiverId: "1",
        timestamp: new Date(new Date().getTime() - 25 * 60000),
        status: "read",
        type: "text",
      },
      {
        id: "8",
        content: "I've been having trouble sleeping lately due to job stress.",
        senderId: "patient-1",
        receiverId: "1",
        timestamp: new Date(new Date().getTime() - 10 * 60000),
        status: "delivered",
        type: "text",
      },
    ];
  } else if (patientId === "patient-2") {
    return [
      {
        id: "1",
        content: "Hello Rob, how are the mindfulness exercises working for you?",
        senderId: "1",
        receiverId: "patient-2",
        timestamp: new Date(new Date().getTime() - 24 * 60 * 60000),
        status: "read",
        type: "text",
      },
      {
        id: "2",
        content: "The mindfulness exercises have been really helpful, thank you.",
        senderId: "patient-2",
        receiverId: "1",
        timestamp: new Date(new Date().getTime() - 24 * 59 * 60000),
        status: "read",
        type: "text",
      },
    ];
  } else if (patientId === "patient-3") {
    return [
      {
        id: "1",
        content: "When can we schedule our next session?",
        senderId: "patient-3",
        receiverId: "1",
        timestamp: new Date(new Date().getTime() - 3 * 24 * 60 * 60000),
        status: "read",
        type: "text",
      },
    ];
  }
  return [];
};

const formatMessageTime = (date: Date) => {
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

export default function TherapistChat() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState(patients);
  const [currentChat, setCurrentChat] = useState<typeof patients[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (id) {
      const chat = conversations.find(c => c.id === id);
      if (chat) {
        setCurrentChat(chat);
        setMessages(getDemoMessages(chat.id));
      } else {
        navigate("/therapist/chat");
      }
    } else if (conversations.length > 0 && !currentChat) {
      setCurrentChat(conversations[0]);
      setMessages(getDemoMessages(conversations[0].id));
    }
  }, [id, conversations, navigate]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentChat) return;
    
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      content: newMessage,
      senderId: "1", // therapist id
      receiverId: currentChat.id,
      timestamp: new Date(),
      status: "sent",
      type: "text",
    };
    
    setMessages(prev => [...prev, newMsg]);
    setNewMessage("");
    
    // Simulate patient typing
    setTimeout(() => {
      setIsTyping(true);
      
      // Simulate patient response
      setTimeout(() => {
        const responseMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          content: "That sounds good, I'll try what you suggested. Thank you.",
          senderId: currentChat.id,
          receiverId: "1",
          timestamp: new Date(),
          status: "sent",
          type: "text",
        };
        
        setMessages(prev => [...prev, responseMsg]);
        setIsTyping(false);
        
        // Update the last message in conversations
        setConversations(prev => 
          prev.map(conv => 
            conv.id === currentChat.id 
              ? { 
                  ...conv, 
                  lastMessage: responseMsg.content,
                  lastMessageTime: "Just now",
                  unreadCount: 0
                }
              : conv
          )
        );
      }, 3000);
    }, 1000);
    
    // Immediately update the conversations list with the sent message
    setConversations(prev => 
      prev.map(conv => 
        conv.id === currentChat.id 
          ? { 
              ...conv, 
              lastMessage: newMessage,
              lastMessageTime: "Just now",
              unreadCount: 0
            }
          : conv
      )
    );
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-3.5rem)] flex">
        {/* Conversations List */}
        <div className="w-full sm:w-80 border-r border-border bg-black/30 hidden sm:block">
          <div className="p-4 space-y-4">
            <PageTitle title="Patients" subtitle="Your conversations" />
            <Input 
              placeholder="Search patients or tags..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/30"
            />
          </div>
          
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-1 p-2">
              {filteredConversations.length > 0 ? (
                filteredConversations.map(conv => (
                  <Link
                    key={conv.id}
                    to={`/therapist/chat/${conv.id}`}
                  >
                    <div 
                      className={`flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors ${
                        currentChat?.id === conv.id ? 'bg-secondary/30' : ''
                      }`}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={conv.profilePic} />
                          <AvatarFallback>
                            {conv.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {conv.online && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className="font-medium truncate">{conv.name}</p>
                          <span className="text-xs text-muted-foreground">{conv.lastMessageTime}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {conv.tags.map(tag => (
                            <span 
                              key={tag} 
                              className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-xs text-white">{conv.unreadCount}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No patients match your search
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {currentChat ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-border p-4 bg-black/40 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={currentChat.profilePic} />
                    <AvatarFallback>
                      {currentChat.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{currentChat.name}</p>
                    <div className="flex gap-1 mt-1">
                      {currentChat.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-5 w-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View patient profile</DropdownMenuItem>
                      <DropdownMenuItem>Update patient notes</DropdownMenuItem>
                      <DropdownMenuItem>Schedule session</DropdownMenuItem>
                      <DropdownMenuItem>Clear chat</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Patient notes card */}
                  <div className="bg-secondary/20 border border-border rounded-lg p-3 mb-4">
                    <h4 className="font-medium text-sm">Patient Notes</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentChat.notes}
                    </p>
                  </div>
                  
                  {messages.map((message, i) => {
                    const isTherapist = message.senderId === "1";
                    const showTimestamp = i === 0 || 
                      new Date(message.timestamp).getDate() !== new Date(messages[i-1].timestamp).getDate();
                    
                    return (
                      <div key={message.id}>
                        {showTimestamp && (
                          <div className="flex justify-center my-4">
                            <div className="bg-secondary px-3 py-1 rounded-full text-xs text-secondary-foreground">
                              {new Date(message.timestamp).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                            </div>
                          </div>
                        )}
                        
                        <div className={`flex ${isTherapist ? "justify-end" : "justify-start"}`}>
                          <div className={`flex items-start gap-2 max-w-[75%] ${isTherapist ? "flex-row-reverse" : ""}`}>
                            <Avatar className="h-8 w-8 mt-1">
                              {isTherapist ? (
                                <>
                                  <AvatarImage src={user?.profilePic} />
                                  <AvatarFallback>{user?.name?.charAt(0) || "T"}</AvatarFallback>
                                </>
                              ) : (
                                <>
                                  <AvatarImage src={currentChat.profilePic} />
                                  <AvatarFallback>{currentChat.name.charAt(0)}</AvatarFallback>
                                </>
                              )}
                            </Avatar>
                            
                            <div className={`rounded-lg overflow-hidden ${
                              isTherapist 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-secondary text-secondary-foreground"
                            }`}>
                              {message.type === "text" ? (
                                <div className="p-3">
                                  <p className="text-sm">{message.content}</p>
                                  <div className="text-xs opacity-70 mt-1 text-right">
                                    {formatMessageTime(new Date(message.timestamp))}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <img 
                                    src={message.imageUrl} 
                                    alt="Shared file" 
                                    className="max-h-48 w-auto object-contain"
                                  />
                                  <div className="p-3">
                                    <p className="text-sm">{message.content}</p>
                                    <div className="text-xs opacity-70 mt-1 text-right">
                                      {formatMessageTime(new Date(message.timestamp))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={currentChat.profilePic} />
                          <AvatarFallback>{currentChat.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg p-3 bg-secondary text-secondary-foreground">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="h-2 w-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }}></div>
                            <div className="h-2 w-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Message Input */}
              <div className="border-t border-border p-4 bg-black/40 backdrop-blur-sm">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Image className="h-5 w-5" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 bg-black/30"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-6 max-w-md">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">Select a patient</h3>
                <p className="text-muted-foreground mt-2">
                  Choose a patient from the list to view your conversation history and send messages.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
