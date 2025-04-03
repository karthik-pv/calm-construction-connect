import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Clock, MoreVertical, ArrowLeft, Loader2, UserCircle2, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChatMessages, useChatConversations, useSendChatMessage, useMarkMessagesAsRead, formatMessageTime } from "@/hooks/useChat";

export default function TherapistChat() {
  const { profile } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [newMessage, setNewMessage] = useState("");
  const [patientNotes, setPatientNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "notes">("chat");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch conversations (existing chats)
  const { 
    data: conversations = [], 
    isLoading: conversationsLoading,
    error: conversationsError 
  } = useChatConversations();
  
  // Fetch messages for current conversation
  const { 
    data: messages = [], 
    isLoading: messagesLoading,
    error: messagesError 
  } = useChatMessages(id);
  
  // Send message mutation
  const sendMessageMutation = useSendChatMessage();
  
  // Mark messages as read mutation
  const markMessagesAsRead = useMarkMessagesAsRead();
  
  // Current conversation partner details
  const currentPatient = id ? conversations.find(c => c.id === id) : null;
  
  // Keep track of which message IDs have already been marked as read
  const [markedMessageIds, setMarkedMessageIds] = useState<Record<string, boolean>>({});
  
  // Effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Effect to mark messages as read when viewing a conversation
  useEffect(() => {
    if (id && messages.length > 0) {
      // Filter messages that are unread AND haven't been marked yet in this session
      const unreadMessages = messages.filter(
        msg => msg.sender_id === id && !msg.read && !markedMessageIds[msg.id]
      );
      
      if (unreadMessages.length > 0) {
        // Update our tracking state first to prevent duplicate attempts
        const newMarkedIds = { ...markedMessageIds };
        unreadMessages.forEach(msg => {
          newMarkedIds[msg.id] = true;
        });
        setMarkedMessageIds(newMarkedIds);
        
        // Then mark as read in the database
        markMessagesAsRead.mutate(id);
      }
    }
  }, [id, messages, markMessagesAsRead, markedMessageIds]);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Handle sending a new message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !id) return;
    
    sendMessageMutation.mutate({
      receiverId: id,
      content: newMessage
    }, {
      onSuccess: () => {
        setNewMessage("");
        messageInputRef.current?.focus();
      }
    });
  };
  
  // Handle key press in the message input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };
  
  // Go back to the conversation list on mobile
  const handleBackToList = () => {
    navigate('/therapist/chat');
  };

  // Get tags from patient notes (mock implementation)
  const getTags = (patientId: string) => {
    const tags: Record<string, string[]> = {
      "patient-1": ["Anxiety", "Sleep Issues"],
      "patient-2": ["Depression", "Anxiety"],
      "patient-3": ["PTSD", "Anger Management"],
    };
    
    return tags[patientId] || [];
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col md:flex-row">
        {/* Conversations List - Only shown on larger screens or when no conversation is selected */}
        <div 
          className={`${
            id ? 'hidden md:block' : 'block'
          } w-full md:w-80 md:border-r border-border bg-black/30`}
        >
          <div className="p-4">
            <PageTitle title="Patient Chats" subtitle="Conversations with your patients" />
            
            {conversationsLoading ? (
              // Loading skeletons
              <div className="space-y-3 p-2 mt-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversationsError ? (
              <div className="p-4 text-center text-destructive mt-4">
                Failed to load conversations
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground mt-4">
                <p>No patient conversations yet</p>
                <p className="text-sm mt-1">Your patients will appear here when they message you</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-9rem)] mt-4">
                <div className="space-y-1 p-2">
                  {conversations.map(conv => (
                    <Link
                      key={conv.id}
                      to={`/therapist/chat/${conv.id}`}
                    >
                      <div 
                        className={`flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors ${
                          currentPatient?.id === conv.id ? 'bg-secondary/30' : ''
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
                          {/* Show some tags for the patient (could be stored in a separate table in a real app) */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {getTags(conv.id).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs py-0">
                                {tag}
                              </Badge>
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
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${id ? 'block' : 'hidden md:block'}`}>
          {currentPatient ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-border p-4 bg-black/40 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden mr-1"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar>
                    <AvatarImage src={currentPatient.profilePic} />
                    <AvatarFallback>
                      {currentPatient.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{currentPatient.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {currentPatient.online ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-green-500"></span>
                          <span>Online</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>Offline</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View patient profile</DropdownMenuItem>
                      <DropdownMenuItem>Schedule session</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Tabs for Chat and Notes */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "chat" | "notes")} className="flex-1 flex flex-col">
                <div className="border-b border-border bg-black/20 backdrop-blur-sm">
                  <TabsList className="w-full flex justify-center">
                    <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
                    <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0 data-[state=inactive]:hidden">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="flex flex-col items-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="mt-2 text-sm text-muted-foreground">Loading messages...</p>
                        </div>
                      </div>
                    ) : messagesError ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="text-center p-4">
                          <p className="text-destructive">Failed to load messages</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => window.location.reload()}
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col justify-center items-center h-full text-center p-4">
                        <Avatar className="h-16 w-16 mb-4">
                          <AvatarImage src={currentPatient.profilePic} />
                          <AvatarFallback className="text-lg">
                            {currentPatient.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-bold mb-2">{currentPatient.name}</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                          This is the beginning of your conversation with {currentPatient.name}.
                          Send them a message to get started.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {getTags(currentPatient.id).map(tag => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message, i) => {
                          const isTherapist = message.sender_id === profile?.id;
                          const showTimestamp = i === 0 || 
                            new Date(message.created_at).getDate() !== new Date(messages[i-1].created_at).getDate();
                          
                          return (
                            <div key={message.id}>
                              {showTimestamp && (
                                <div className="flex justify-center my-4">
                                  <div className="bg-secondary px-3 py-1 rounded-full text-xs text-secondary-foreground">
                                    {new Date(message.created_at).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                                  </div>
                                </div>
                              )}
                              
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${isTherapist ? "justify-end" : "justify-start"}`}
                              >
                                <div className={`flex items-start gap-2 max-w-[75%] ${isTherapist ? "flex-row-reverse" : ""}`}>
                                  <Avatar className="h-8 w-8 mt-1">
                                    {isTherapist ? (
                                      <>
                                        <AvatarImage src={profile?.avatar_url || ""} />
                                        <AvatarFallback>{profile?.full_name?.charAt(0) || "T"}</AvatarFallback>
                                      </>
                                    ) : (
                                      <>
                                        <AvatarImage src={currentPatient.profilePic} />
                                        <AvatarFallback>{currentPatient.name.charAt(0)}</AvatarFallback>
                                      </>
                                    )}
                                  </Avatar>
                                  
                                  <div className={`rounded-lg p-3 ${
                                    isTherapist 
                                      ? "bg-primary text-primary-foreground" 
                                      : "bg-secondary text-secondary-foreground"
                                  }`}>
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                    <div className="text-xs opacity-70 mt-1 text-right">
                                      {formatMessageTime(message.created_at)}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          );
                        })}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                  
                  {/* Message Input */}
                  <div className="border-t border-border p-4 bg-black/40 backdrop-blur-sm">
                    <div className="flex gap-2">
                      <Input
                        ref={messageInputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 bg-black/30"
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="notes" className="flex-1 flex flex-col p-0 m-0 data-[state=inactive]:hidden">
                  <div className="p-4 flex-1 overflow-auto">
                    <Card className="bg-black/30 border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <UserCircle2 className="h-5 w-5 mr-2" />
                          Patient Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium mb-2">Issues & Concerns</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {getTags(currentPatient.id).map(tag => (
                                <Badge key={tag} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">Notes</h3>
                            <textarea
                              value={patientNotes}
                              onChange={(e) => setPatientNotes(e.target.value)}
                              placeholder="Add your private notes about this patient here..."
                              className="w-full h-40 rounded-md border border-border bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          
                          <div className="flex justify-end">
                            <Button>
                              <FileText className="h-4 w-4 mr-2" />
                              Save Notes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-6 max-w-md">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">Select a conversation</h3>
                <p className="text-muted-foreground mt-2">
                  Choose a patient from the list to view your conversation history and continue chatting.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
