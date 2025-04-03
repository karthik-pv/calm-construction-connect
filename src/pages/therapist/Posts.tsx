import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookmarkPlus, Heart, Pencil, Image, Trash2, Loader2, X, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTherapistPosts, useTogglePostLike, useTogglePostSave } from "@/hooks/useTherapistPosts";
import { useCreateTherapistPost } from "@/hooks/useCreateTherapistPost";
import { supabase } from "@/lib/supabaseClient";

export default function TherapistPosts() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for the post creation form
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTags, setNewPostTags] = useState("");
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  
  // State for editing
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch real posts using the hook
  const { data: posts = [], isLoading, error } = useTherapistPosts();
  console.log("POSTS FROM HOOK:", { posts, isLoading, error });
  
  // Get mutations for interacting with posts
  const toggleLikeMutation = useTogglePostLike();
  const toggleSaveMutation = useTogglePostSave();
  
  // Get mutation for creating posts
  const createPostMutation = useCreateTherapistPost();
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...filesArray]);
      
      // Create preview URLs
      const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };
  
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    
    // Also remove the preview URL and revoke the object URL to free memory
    const urlToRemove = imagePreviewUrls[index];
    URL.revokeObjectURL(urlToRemove);
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];
    
    setUploadingImages(true);
    const imageUrls: string[] = [];
    
    try {
      for (const file of selectedImages) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `post_images/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(filePath, file);
          
        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          continue;
        }
        
        // Get public URL
        const { data } = supabase.storage
          .from('post_images')
          .getPublicUrl(filePath);
          
        if (data?.publicUrl) {
          imageUrls.push(data.publicUrl);
        }
      }
      
      return imageUrls;
    } catch (e) {
      console.error("Error in uploadImages:", e);
      toast.error("Some images failed to upload");
      return imageUrls; // Return any successfully uploaded images
    } finally {
      setUploadingImages(false);
    }
  };
  
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }
    
    const tags = newPostTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);
    
    // First upload any images
    const uploadedImageUrls = await uploadImages();
    
    console.log("Creating post:", { content: newPostContent, tags, images: uploadedImageUrls });
    
    createPostMutation.mutate({
      content: newPostContent,
      tags,
      images: uploadedImageUrls
    }, {
      onSuccess: () => {
        setNewPostContent("");
        setNewPostTags("");
        setSelectedImages([]);
        setImagePreviewUrls([]);
        setShowNewPostForm(false);
      }
    });
  };
  
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
        .from('therapist_posts')
        .update({ content: editContent })
        .eq('id', postId);
      
      if (error) {
        console.error("Error updating post:", error);
        toast.error("Failed to update post");
        return;
      }
      
      // Handle tags update
      const newTags = editTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
        
      // First delete existing tags
      await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', postId);
        
      // Then add new tags
      if (newTags.length > 0) {
        const tagRows = newTags.map(tag => ({
          post_id: postId,
          tag
        }));
        
        const { error: tagsError } = await supabase
          .from('post_tags')
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
      const queryClient = createPostMutation.getQueryClient();
      queryClient.invalidateQueries({ queryKey: ['therapist-posts'] });
      
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
        .from('therapist_posts')
        .delete()
        .eq('id', postId);
        
      if (error) {
        console.error("Error deleting post:", error);
        toast.error("Failed to delete post");
        return;
      }
      
      toast.success("Post deleted successfully");
      
      // Invalidate the cache to trigger a refetch
      const queryClient = createPostMutation.getQueryClient();
      queryClient.invalidateQueries({ queryKey: ['therapist-posts'] });
      
    } catch (e) {
      console.error("Error deleting post:", e);
      toast.error("Failed to delete post");
    }
  };
  
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageTitle title="Mental Health Posts" subtitle="Share insights and resources with your patients" />
          
          <Link to="/therapist/posts/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </Link>
        </div>
        
        {/* Create new post button and form */}
        <div className="mb-6">
          <Button 
            onClick={() => setShowNewPostForm(!showNewPostForm)}
            className="mb-4"
          >
            {showNewPostForm ? "Cancel" : "Create New Post"}
          </Button>
          
          {showNewPostForm && (
            <Card className="bg-black/40 border-border backdrop-blur-md p-4">
              <CardHeader>
                <CardTitle>Create New Post</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block mb-2">Content</label>
                  <textarea 
                    className="w-full p-2 rounded bg-black/30 border border-border"
                    rows={4}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Write your post content here..."
                  />
                </div>
                
                <div>
                  <label className="block mb-2">Tags (comma separated)</label>
                  <Input 
                    value={newPostTags}
                    onChange={(e) => setNewPostTags(e.target.value)}
                    placeholder="anxiety, mental health, etc."
                    className="bg-black/30"
                  />
                </div>
                
                <div>
                  <label className="block mb-2">Images</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={url} 
                          alt={`Preview ${index}`} 
                          className="h-20 w-20 object-cover rounded-md"
                        />
                        <button 
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                          onClick={() => removeImage(index)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1"
                  >
                    <Image className="h-4 w-4" />
                    Add Images
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleCreatePost}
                  disabled={createPostMutation.isPending || !newPostContent.trim() || uploadingImages}
                >
                  {(createPostMutation.isPending || uploadingImages) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadingImages ? "Uploading images..." : "Creating..."}
                    </>
                  ) : "Create Post"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
        
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
                        
                        {/* Edit/Delete dropdown if it's the user's post */}
                        {post.author_id === profile?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEditingPost(post)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deletePost(post.id)}>
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
                            className="w-full p-2 rounded bg-black/30 border border-border"
                            rows={4}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                          />
                          
                          <Input 
                            value={editTags}
                            onChange={(e) => setEditTags(e.target.value)}
                            placeholder="Tags (comma separated)"
                            className="bg-black/30"
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
