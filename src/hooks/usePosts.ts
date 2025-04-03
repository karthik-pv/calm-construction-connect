// src/hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext'; // To get current user ID for mutations

// Define the structure of a post with author profile info
export interface PostWithAuthor {
  id: number;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  image_url?: string;
  profiles: { // Joined data from profiles table
    full_name: string | null;
    avatar_url: string | null;
  } | null; // Profile might be null if somehow deleted
}

// Define the structure for creating a new post
export interface NewPostData {
  title: string;
  content: string;
  image_url?: string;
}

// --- Fetching Posts ---
const fetchPosts = async (): Promise<PostWithAuthor[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      user_id,
      title,
      content,
      created_at,
      image_url,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false }); // Show newest first

  if (error) {
    console.error("Error fetching posts:", error);
    toast.error("Failed to load posts.");
    throw new Error(error.message);
  }
  // Ensure profiles isn't an array if the relationship is one-to-one
  // Supabase might return an array even for one-to-one if not specified
  // Although profiles() implies one-to-one here. Check return type if issues arise.
  return data || [];
};

export function usePosts() {
  return useQuery<PostWithAuthor[], Error>({
    queryKey: ['posts'], // Key for caching
    queryFn: fetchPosts,
  });
}

// --- Creating a Post ---
const createPost = async (newPostData: NewPostData, userId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .insert([{ ...newPostData, user_id: userId }])
    .select() // Return the created post
    .single(); // Expecting a single row back

  if (error) {
    console.error("Error creating post:", error);
    toast.error("Failed to create post.");
    throw new Error(error.message);
  }
  return data;
};

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Get current user

  return useMutation({
    mutationFn: (newPostData: NewPostData) => {
      if (!user) throw new Error("User must be logged in to create a post");
      return createPost(newPostData, user.id);
    },
    onSuccess: () => {
      // Invalidate the 'posts' query cache to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success("Post created successfully!");
    },
    onError: (error) => {
      // Error toast is handled in createPost, but maybe add more context here
      console.error("Mutation error creating post:", error);
    },
  });
}

// --- Deleting a Post ---
const deletePost = async (postId: number, userId: string) => {
  // RLS policy ensures user can only delete their own post
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId); // Extra check for safety, though RLS handles it

  if (error) {
    console.error("Error deleting post:", error);
    toast.error("Failed to delete post. You may only delete your own posts.");
    throw new Error(error.message);
  }
  // No data returned on delete
};

export function useDeletePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Get current user for user_id check

  return useMutation({
    mutationFn: (postId: number) => {
       if (!user) throw new Error("User must be logged in to delete a post");
       return deletePost(postId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success("Post deleted successfully!");
    },
    onError: (error) => {
      console.error("Mutation error deleting post:", error);
    },
  });
} 