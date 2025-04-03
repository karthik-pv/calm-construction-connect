import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookmarkPlus, Heart, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTherapistPosts, useTogglePostLike, useTogglePostSave } from "@/hooks/useTherapistPosts";

export default function PatientPosts() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch real posts using the hook
  const { data: posts = [], isLoading, error } = useTherapistPosts();
  
  // Get mutations for interacting with posts
  const toggleLikeMutation = useTogglePostLike();
  const toggleSaveMutation = useTogglePostSave();
  
  const filteredPosts = posts.filter(post => {
    if (activeTab === "saved" && !post.saved) {
      return false;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        post.content.toLowerCase().includes(searchLower) ||
        post.author_name.toLowerCase().includes(searchLower) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
  
  const handleToggleLike = (postId: string, isCurrentlyLiked: boolean) => {
    toggleLikeMutation.mutate({ postId, isCurrentlyLiked });
  };
  
  const handleToggleSave = (postId: string, isCurrentlySaved: boolean) => {
    toggleSaveMutation.mutate({ postId, isCurrentlySaved });
  };
  
  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        <br />
      </span>
    ));
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <PageTitle title="Mental Health Posts" subtitle="Insights and advice from mental health professionals" />
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md bg-black/30"
          />
          
          <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">All Posts</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading posts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 border border-dashed border-destructive rounded-lg">
            <h3 className="text-xl font-medium mb-2 text-destructive">Error loading posts</h3>
            <p className="text-muted-foreground mb-4">
              There was a problem loading the posts. Please try again later.
            </p>
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6 max-w-3xl mx-auto"
          >
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <motion.div key={post.id} variants={item}>
                  <Card className="bg-black/40 border-border backdrop-blur-md overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={post.author_avatar || ""} />
                          <AvatarFallback>{post.author_name ? post.author_name[0] : "T"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-base">{post.author_name}</CardTitle>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">{post.author_title}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(post.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-3">
                      <div className="space-y-4">
                        <p className="text-sm whitespace-pre-line">
                          {formatContent(post.content)}
                        </p>
                        
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {post.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {post.images.length > 0 && (
                          <div className={`grid gap-2 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {post.images.map((img, i) => (
                              <img 
                                key={i} 
                                src={img} 
                                alt={`Post ${post.id} image ${i+1}`}
                                className="w-full rounded-lg object-cover max-h-96"
                              />
                            ))}
                          </div>
                        )}
                        
                        {post.video && (
                          <div className="aspect-video rounded-lg overflow-hidden">
                            <iframe
                              src={post.video}
                              frameBorder="0"
                              allow="autoplay; fullscreen; picture-in-picture"
                              className="w-full h-full"
                              title={`Post ${post.id} video`}
                            ></iframe>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    
                    <Separator />
                    
                    <CardFooter className="pt-3">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <span>{post.likes_count} likes</span>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleToggleLike(post.id, post.liked)}
                            className={post.liked ? "text-red-500" : ""}
                            disabled={toggleLikeMutation.isPending}
                          >
                            <Heart className={`h-5 w-5 ${post.liked ? "fill-red-500" : ""}`} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleToggleSave(post.id, post.saved)}
                            className={post.saved ? "text-primary" : ""}
                            disabled={toggleSaveMutation.isPending}
                          >
                            <BookmarkPlus className={`h-5 w-5 ${post.saved ? "fill-primary" : ""}`} />
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-muted rounded-lg">
                <h3 className="text-xl font-medium mb-2">No posts found</h3>
                <p className="text-muted-foreground">
                  {activeTab === "saved" 
                    ? "You haven't saved any posts yet."
                    : "No posts match your search criteria."}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
