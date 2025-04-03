import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// Define the structure for creating a new post
interface NewTherapistPostData {
  content: string;
  tags?: string[];
  images?: string[];
}

// Simple post creation function that works with existing Supabase setup
const createTherapistPost = async (postData: NewTherapistPostData): Promise<string> => {
  const { content, tags = [], images = [] } = postData;
  
  // Get the current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData?.user?.id) {
    console.error("Authentication error:", userError);
    toast.error("You must be logged in to create a post");
    throw new Error("Not authenticated");
  }
  
  console.log("Creating post for user:", userData.user.id);
  
  try {
    // Insert the post directly
    const { data: postResult, error: postError } = await supabase
      .from('therapist_posts')
      .insert({
        content: content,
        author_id: userData.user.id,
        likes: 0
      })
      .select('id')
      .single();
    
    if (postError) {
      console.error("Error creating post:", postError);
      
      // Try with a simpler insert if select is not supported
      const { error: fallbackError } = await supabase
        .from('therapist_posts')
        .insert({
          content: content,
          author_id: userData.user.id,
          likes: 0
        });
      
      if (fallbackError) {
        throw fallbackError;
      }
      
      // If we made it here, the post was created but we don't have the ID
      // Try to find it by content + author + timestamp (approximate)
      const { data: newPosts, error: fetchError } = await supabase
        .from('therapist_posts')
        .select('id')
        .eq('content', content)
        .eq('author_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (fetchError || !newPosts || newPosts.length === 0) {
        console.error("Post was created but couldn't fetch ID:", fetchError);
        toast.success("Post created successfully, but interactions might be limited");
        return "unknown";
      }
      
      const postId = newPosts[0].id;
      
      // Add tags if the table exists
      try {
        if (tags.length > 0) {
          const tagRows = tags.map(tag => ({
            post_id: postId,
            tag
          }));
          
          await supabase.from('post_tags').insert(tagRows);
        }
      } catch (e) {
        console.log("Could not add tags, table might not exist:", e);
      }
      
      // Add images if the table exists
      try {
        if (images.length > 0) {
          const imageRows = images.map((url, index) => ({
            post_id: postId,
            image_url: url,
            position: index
          }));
          
          await supabase.from('post_images').insert(imageRows);
        }
      } catch (e) {
        console.log("Could not add images, table might not exist:", e);
      }
      
      return postId;
    }
    
    // Normal flow - post was created and we have the ID
    const postId = postResult.id;
    console.log("Post created successfully:", postId);
    
    // Add tags if the table exists
    try {
      if (tags.length > 0) {
        const tagRows = tags.map(tag => ({
          post_id: postId,
          tag
        }));
        
        await supabase.from('post_tags').insert(tagRows);
      }
    } catch (e) {
      console.log("Could not add tags, table might not exist:", e);
    }
    
    // Add images if the table exists
    try {
      if (images.length > 0) {
        const imageRows = images.map((url, index) => ({
          post_id: postId,
          image_url: url,
          position: index
        }));
        
        await supabase.from('post_images').insert(imageRows);
      }
    } catch (e) {
      console.log("Could not add images, table might not exist:", e);
    }
    
    return postId;
  } catch (e) {
    console.error("Error in createTherapistPost:", e);
    toast.error("Failed to create post");
    throw e;
  }
};

export function useCreateTherapistPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTherapistPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-posts'] });
      toast.success("Post created successfully!");
    },
    onError: (error) => {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
    },
  });
} 