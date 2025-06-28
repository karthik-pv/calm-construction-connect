import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookmarkPlus,
  Heart,
  Pencil,
  Image,
  Trash2,
  Loader2,
  X,
  Plus,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useTherapistPosts,
  useTogglePostLike,
  useTogglePostSave,
} from "@/hooks/useTherapistPosts";
import { useCreateTherapistPost } from "@/hooks/useCreateTherapistPost";
import { supabase } from "@/lib/supabaseClient";

export default function TherapistPosts() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // State for editing
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");

  // Fetch real posts using the hook
  const { data: posts = [], isLoading, error } = useTherapistPosts();
  console.log("POSTS FROM HOOK:", { posts, isLoading, error });

  // Get mutations for interacting with posts
  const toggleLikeMutation = useTogglePostLike();
  const toggleSaveMutation = useTogglePostSave();

  const startEditingPost = (post: any) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setEditTags(post.tags.join(", "));
  };

  const cancelEditingPost = () => {
    setEditingPostId(null);
    setEditContent("");
    setEditTags("");
  };

  const saveEditedPost = async (postId: string) => {
    if (!editContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("therapist_posts")
        .update({ content: editContent })
        .eq("id", postId);

      if (error) {
        console.error("Error updating post:", error);
        toast.error("Failed to update post");
        return;
      }

      // Handle tags update
      const newTags = editTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      // First delete existing tags
      await supabase.from("post_tags").delete().eq("post_id", postId);

      // Then add new tags
      if (newTags.length > 0) {
        const tagRows = newTags.map((tag) => ({
          post_id: postId,
          tag,
        }));

        const { error: tagsError } = await supabase
          .from("post_tags")
          .insert(tagRows);

        if (tagsError) {
          console.error("Error updating tags:", tagsError);
        }
      }

      // Reset edit state
      cancelEditingPost();

      // Refresh posts
      toast.success("Post updated successfully");

      // Invalidate the cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["therapist-posts"] });
    } catch (e) {
      console.error("Error saving edited post:", e);
      toast.error("Failed to update post");
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("therapist_posts")
        .delete()
        .eq("id", postId);

      if (error) {
        console.error("Error deleting post:", error);
        toast.error("Failed to delete post");
        return;
      }

      toast.success("Post deleted successfully");

      // Invalidate the cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["therapist-posts"] });
    } catch (e) {
      console.error("Error deleting post:", e);
      toast.error("Failed to delete post");
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (activeTab === "saved" && !post.saved) {
      return false;
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        post.content.toLowerCase().includes(searchLower) ||
        post.author_name.toLowerCase().includes(searchLower) ||
        post.tags.some((tag) => tag.toLowerCase().includes(searchLower))
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
    return content.split("\n").map((line, i) => (
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
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageTitle
            title="Mental Health Posts"
            subtitle="Share insights and resources with your patients"
          />

          <Link to="/therapist/posts/create">
            <Button className="glass-button">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input max-w-md"
          />

          <Tabs
            defaultValue="all"
            onValueChange={setActiveTab}
            className="w-full sm:w-auto"
          >
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
            <h3 className="text-xl font-medium mb-2 text-destructive">
              Error loading posts
            </h3>
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
              filteredPosts.map((post) => (
                <motion.div key={post.id} variants={item}>
                  <Card className="glass-card overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={post.author_avatar || ""} />
                          <AvatarFallback className="glass-avatar">
                            {post.author_name ? post.author_name[0] : "T"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-base">
                            {post.author_name}
                          </CardTitle>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              {post.author_title}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(post.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Edit/Delete dropdown if it's the user's post */}
                        {post.author_id === profile?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="glass-button"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="19" cy="12" r="1" />
                                  <circle cx="5" cy="12" r="1" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => startEditingPost(post)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deletePost(post.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pb-3">
                      {editingPostId === post.id ? (
                        <div className="space-y-4">
                          <textarea
                            className="glass-input w-full"
                            rows={4}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                          />

                          <Input
                            value={editTags}
                            onChange={(e) => setEditTags(e.target.value)}
                            placeholder="Tags (comma separated)"
                            className="glass-input"
                          />

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveEditedPost(post.id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditingPost}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm whitespace-pre-line">
                            {formatContent(post.content)}
                          </p>

                          {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {post.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {post.images.length > 0 && (
                            <div
                              className={`grid gap-2 ${
                                post.images.length > 1
                                  ? "grid-cols-2"
                                  : "grid-cols-1"
                              }`}
                            >
                              {post.images.map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt={`Post ${post.id} image ${i + 1}`}
                                  className="w-full rounded-lg object-cover max-h-96"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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
                            onClick={() =>
                              handleToggleLike(post.id, post.liked)
                            }
                            className={post.liked ? "text-red-500" : ""}
                            disabled={toggleLikeMutation.isPending}
                          >
                            <Heart
                              className={`h-5 w-5 ${
                                post.liked ? "fill-red-500" : ""
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleToggleSave(post.id, post.saved)
                            }
                            className={post.saved ? "text-primary" : ""}
                            disabled={toggleSaveMutation.isPending}
                          >
                            <BookmarkPlus
                              className={`h-5 w-5 ${
                                post.saved ? "fill-primary" : ""
                              }`}
                            />
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
