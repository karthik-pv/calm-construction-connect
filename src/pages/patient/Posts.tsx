
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookmarkPlus, Heart, MessageCircle, Share2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

// Demo posts data
const demoPostsData = [
  {
    id: "1",
    authorId: "2",
    authorName: "Dr. Sarah Thompson",
    authorAvatar: "https://i.pravatar.cc/150?img=5",
    authorTitle: "Clinical Psychologist",
    content: "Recognizing signs of burnout in construction: \n\n1. Exhaustion that sleep doesn't fix\n2. Increased irritability with colleagues\n3. Feeling detached from your work\n4. Decreased performance despite working longer hours\n\nBurnout is a serious condition that requires attention. If you're experiencing these symptoms, consider it a warning sign to prioritize your mental health.",
    images: [],
    video: null,
    tags: ["burnout", "construction", "mentalhealth"],
    likes: 28,
    comments: 7,
    shares: 4,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    liked: false,
    saved: true,
  },
  {
    id: "2",
    authorId: "3",
    authorName: "Dr. Michael Reynolds",
    authorAvatar: "https://i.pravatar.cc/150?img=12",
    authorTitle: "Mental Health Counselor",
    content: "Today I want to talk about the stigma surrounding mental health in the construction industry. Many workers feel they can't speak up about their struggles due to fear of judgment or being seen as 'weak'.\n\nRemember: Seeking help is a sign of strength, not weakness. Your mental health is just as important as your physical safety on the job site.",
    images: ["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format"],
    video: null,
    tags: ["stigma", "speakup", "constructionworkers"],
    likes: 42,
    comments: 13,
    shares: 9,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    liked: true,
    saved: false,
  },
  {
    id: "3",
    authorId: "4",
    authorName: "Dr. Emily Chen",
    authorAvatar: "https://i.pravatar.cc/150?img=9",
    authorTitle: "Trauma Specialist",
    content: "Quick breathing exercise for anxiety on the job site:\n\n1. Find a quiet spot for 2 minutes\n2. Breathe in through your nose for 4 counts\n3. Hold for 2 counts\n4. Exhale through your mouth for 6 counts\n5. Repeat 5 times\n\nThis technique activates your parasympathetic nervous system and helps bring calm during stressful moments.",
    images: [],
    video: "https://player.vimeo.com/video/684312905",
    tags: ["anxiety", "breathwork", "selfcare"],
    likes: 36,
    comments: 5,
    shares: 15,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    liked: false,
    saved: true,
  },
  {
    id: "4",
    authorId: "2",
    authorName: "Dr. Sarah Thompson",
    authorAvatar: "https://i.pravatar.cc/150?img=5",
    authorTitle: "Clinical Psychologist",
    content: "Depression can manifest differently in men working in construction:\n\n• Increased anger or irritability\n• Risk-taking behavior\n• Substance use\n• Physical complaints (headaches, digestive issues)\n• Withdrawal from colleagues\n\nIf you notice these signs in yourself or a colleague, it's important to reach out for support.",
    images: ["https://images.unsplash.com/photo-1541199249251-f713e6145474?w=800&auto=format"],
    video: null,
    tags: ["depression", "mensinmentalhealth", "support"],
    likes: 54,
    comments: 11,
    shares: 22,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    liked: true,
    saved: false,
  },
];

export default function PatientPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState(demoPostsData);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredPosts = posts.filter(post => {
    if (activeTab === "saved" && !post.saved) {
      return false;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        post.content.toLowerCase().includes(searchLower) ||
        post.authorName.toLowerCase().includes(searchLower) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
  
  const toggleLike = (postId: string) => {
    setPosts(
      posts.map(post => {
        if (post.id === postId) {
          const liked = !post.liked;
          return {
            ...post,
            liked,
            likes: liked ? post.likes + 1 : post.likes - 1,
          };
        }
        return post;
      })
    );
  };
  
  const toggleSave = (postId: string) => {
    setPosts(
      posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            saved: !post.saved,
          };
        }
        return post;
      })
    );
  };
  
  const formatTimestamp = (date: Date) => {
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
                        <AvatarImage src={post.authorAvatar} />
                        <AvatarFallback>{post.authorName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-base">{post.authorName}</CardTitle>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">{post.authorTitle}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(post.timestamp)}
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
                        <span>{post.likes} likes</span>
                        <span>•</span>
                        <span>{post.comments} comments</span>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleLike(post.id)}
                          className={post.liked ? "text-red-500" : ""}
                        >
                          <Heart className={`h-5 w-5 ${post.liked ? "fill-red-500" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Share2 className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleSave(post.id)}
                          className={post.saved ? "text-primary" : ""}
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
      </div>
    </DashboardLayout>
  );
}
