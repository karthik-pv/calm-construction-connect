import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  User,
  Clock,
  MoreVertical,
  Phone,
  Video,
  Image,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  useChatMessages,
  useChatConversations,
  useAvailableTherapists,
  useSendChatMessage,
  useMarkMessagesAsRead,
  formatMessageTime,
} from "@/hooks/useChat";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PatientChat() {
  const { profile } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"chats" | "experts">("chats");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Keep track of which message IDs have already been marked as read
  const [markedMessageIds, setMarkedMessageIds] = useState<
    Record<string, boolean>
  >({});

  // Fetch conversations (existing chats)
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useChatConversations({
    refetchInterval: 3000, // Refetch every 3 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch available experts
  const { data: availableExperts = [], isLoading: expertsLoading } =
    useAvailableTherapists();

  // Fetch messages for current conversation
  const {
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError,
  } = useChatMessages(id);

  // Send message mutation
  const sendMessageMutation = useSendChatMessage();

  // Mark messages as read mutation
  const markMessagesAsRead = useMarkMessagesAsRead();

  // Current conversation partner details
  const currentPartner = id
    ? [...conversations, ...availableExperts].find((c) => c.id === id)
    : null;

  // Effect to mark conversation as viewed locally
  useEffect(() => {
    if (id) {
      console.log(`Marking conversation ${id} as viewed locally`);
    }
  }, [id]);

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to mark messages as read when viewing a conversation
  useEffect(() => {
    if (!id || markMessagesAsRead.isPending) return;

    console.log(`Checking for unread messages in conversation ${id}`);

    // Run this even if messages array is empty or still loading
    // to ensure we don't miss marking messages as read
    markMessagesAsRead.mutate(id, {
      onSuccess: (updatedData) => {
        console.log(
          `Marked ${
            updatedData?.length || 0
          } messages as read in conversation ${id}`
        );

        if (updatedData && updatedData.length > 0) {
          // Update our local tracking state for these specific messages
          const newMarkedIds = { ...markedMessageIds };
          updatedData.forEach((msg) => {
            newMarkedIds[msg.id] = true;
          });
          setMarkedMessageIds(newMarkedIds);
        }
      },
    });
  }, [id]); // Only depend on the conversation ID changing

  // Effect to change tabs based on URL and available conversations
  useEffect(() => {
    if (id) {
      // If we're viewing a specific conversation, make sure we're on the chats tab
      setActiveTab("chats");
    } else if (conversations.length === 0 && !conversationsLoading) {
      // If we have no conversations, default to the therapists tab
      setActiveTab("experts");
    }
  }, [id, conversations.length, conversationsLoading]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle sending a new message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !id) return;

    sendMessageMutation.mutate(
      {
        receiverId: id,
        content: newMessage,
      },
      {
        onSuccess: () => {
          setNewMessage("");
          messageInputRef.current?.focus();
        },
      }
    );
  };

  // Handle key press in the message input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Start a new conversation with an expert
  const startConversation = (expertId: string) => {
    navigate(`/patient/chat/${expertId}`);
  };

  // Go back to the conversation list on mobile
  const handleBackToList = () => {
    navigate("/patient/chat");
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col md:flex-row">
        {/* Conversations List - Only shown on larger screens or when no conversation is selected */}
        <div
          className={`${
            id ? "hidden md:block" : "block"
          } w-full md:w-80 md:border-r border-border bg-black/30`}
        >
          <div className="p-4">
            <PageTitle title="Messages" subtitle="Chat with your experts" />

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "chats" | "experts")}
              className="mt-4"
            >
              <TabsList className="w-full">
                <TabsTrigger
                  value="chats"
                  className="flex-1"
                  disabled={conversationsLoading}
                >
                  My Chats
                </TabsTrigger>
                <TabsTrigger
                  value="experts"
                  className="flex-1"
                  disabled={expertsLoading}
                >
                  Find Expert
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chats" className="mt-4">
                {conversationsLoading ? (
                  // Loading skeletons
                  <div className="space-y-3 p-2">
                    {[1, 2, 3].map((i) => (
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
                  <div className="p-4 text-center text-destructive">
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
                  <div className="p-4 text-center text-muted-foreground">
                    <p>No conversations yet</p>
                    <p className="text-sm mt-1">
                      Start chatting with an expert
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setActiveTab("experts")}
                    >
                      Find an Expert
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-12rem)]">
                    <div className="space-y-1 p-2">
                      {conversations.map((conv) => {
                        // Only show unread indicator if the unread messages are from the OTHER person
                        // If the sender is the current user, don't show the white dot
                        const hasUnread =
                          conv.unreadCount > 0 &&
                          conv.lastMessageSenderId !== profile?.id;

                        return (
                          <Link key={conv.id} to={`/patient/chat/${conv.id}`}>
                            <div
                              className={`flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors ${
                                currentPartner?.id === conv.id
                                  ? "bg-secondary/30"
                                  : ""
                              } ${
                                hasUnread ? "border-l-2 border-primary" : ""
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
                                  <p
                                    className={`font-medium truncate ${
                                      hasUnread
                                        ? "text-white font-semibold"
                                        : ""
                                    }`}
                                  >
                                    {conv.name}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {conv.lastMessageTime}
                                  </span>
                                </div>
                                <p
                                  className={`text-sm truncate ${
                                    hasUnread
                                      ? "text-white"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {conv.lastMessage}
                                </p>
                              </div>
                              {hasUnread && (
                                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-white flex items-center justify-center">
                                  <span className="text-xs text-black font-medium">
                                    {conv.unreadCount}
                                  </span>
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="experts" className="mt-4">
                {expertsLoading ? (
                  // Loading skeletons
                  <div className="space-y-3 p-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : availableExperts.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <p>No experts available</p>
                    <p className="text-sm mt-1">Please check back later</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => navigate("/patient/experts")}
                    >
                      View All Experts
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-12rem)]">
                    <div className="space-y-1 p-2">
                      {availableExperts.map((expert) => (
                        <div
                          key={expert.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                          onClick={() => startConversation(expert.id)}
                        >
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={expert.profilePic} />
                              <AvatarFallback>
                                {expert.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {expert.online && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {expert.name}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              Start a conversation
                            </p>
                          </div>
                          <Button size="sm" variant="default">
                            Chat
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={`flex-1 flex flex-col ${id ? "block" : "hidden md:block"}`}
        >
          {currentPartner ? (
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
                    <AvatarImage src={currentPartner.profilePic} />
                    <AvatarFallback>
                      {currentPartner.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{currentPartner.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {currentPartner.online ? (
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
                      <DropdownMenuItem
                        onClick={() =>
                          navigate(`/patient/experts?id=${currentPartner.id}`)
                        }
                      >
                        View profile
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Loading messages...
                      </p>
                    </div>
                  </div>
                ) : messagesError ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-center p-4">
                      <p className="text-destructive">
                        Failed to load messages
                      </p>
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
                      <AvatarImage src={currentPartner.profilePic} />
                      <AvatarFallback className="text-lg">
                        {currentPartner.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-bold mb-2">
                      {currentPartner.name}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      This is the beginning of your conversation with{" "}
                      {currentPartner.name}. Feel free to share your thoughts
                      and concerns.
                    </p>
                    {currentPartner.online ? (
                      <div className="flex items-center text-sm text-primary">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        <span>Online and ready to chat</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Offline, but will respond when available</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, i) => {
                      const isUser = message.sender_id === profile?.id;
                      const showTimestamp =
                        i === 0 ||
                        new Date(message.created_at).getDate() !==
                          new Date(messages[i - 1].created_at).getDate();

                      return (
                        <div key={message.id}>
                          {showTimestamp && (
                            <div className="flex justify-center my-4">
                              <div className="bg-secondary px-3 py-1 rounded-full text-xs text-secondary-foreground">
                                {new Date(
                                  message.created_at
                                ).toLocaleDateString([], {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </div>
                            </div>
                          )}

                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${
                              isUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`flex items-start gap-2 max-w-[75%] ${
                                isUser ? "flex-row-reverse" : ""
                              }`}
                            >
                              <Avatar className="h-8 w-8 mt-1">
                                {isUser ? (
                                  <>
                                    <AvatarImage
                                      src={profile?.avatar_url || ""}
                                    />
                                    <AvatarFallback>
                                      {profile?.full_name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                  </>
                                ) : (
                                  <>
                                    <AvatarImage
                                      src={currentPartner.profilePic}
                                    />
                                    <AvatarFallback>
                                      {currentPartner.name.charAt(0)}
                                    </AvatarFallback>
                                  </>
                                )}
                              </Avatar>

                              <div
                                className={`rounded-lg p-3 ${
                                  isUser
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
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
                    disabled={
                      !newMessage.trim() || sendMessageMutation.isPending
                    }
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-6 max-w-md">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">Select a conversation</h3>
                <p className="text-muted-foreground mt-2">
                  Choose an expert from the list to start chatting or continue a
                  conversation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
