import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Define the structure of a therapist post
export interface TherapistPost {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  author_title: string | null;
  content: string;
  images: string[];
  tags: string[];
  likes_count: number;
  created_at: string;
  liked: boolean;
  saved: boolean;
}

// Define the structure for creating a new post
export interface NewTherapistPostData {
  content: string;
  tags: string[];
  images?: string[];
}

// --- Fetching Therapist Posts ---
const fetchTherapistPosts = async (): Promise<TherapistPost[]> => {
  console.log("Starting fetchTherapistPosts");

  try {
    // Query the therapist_posts table as requested by the user
    const { data: posts, error: postsError } = await supabase
      .from("therapist_posts")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("Direct query result:", { posts, error: postsError });

    if (postsError) {
      console.error("Error fetching posts directly:", postsError);
      return [];
    }

    if (!posts || posts.length === 0) {
      console.log("No posts found");
      return [];
    }

    // Get the current user for liked/saved status
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData?.user?.id;

    // Get author details and enhance posts
    const authorIds = [...new Set(posts.map((post) => post.author_id))];
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, title, specialization")
      .in("id", authorIds);

    const authorsMap = new Map();
    if (authors) {
      authors.forEach((author) => {
        authorsMap.set(author.id, author);
      });
    }

    // For each post, fetch images, tags, and like/save status
    const enhancedPosts = await Promise.all(
      posts.map(async (post) => {
        // Get images for the post (if the table exists, otherwise empty array)
        let images: string[] = [];
        try {
          const { data: imageData } = await supabase
            .from("post_images")
            .select("image_url")
            .eq("post_id", post.id)
            .order("position", { ascending: true });

          if (imageData && imageData.length > 0) {
            images = imageData.map((img) => img.image_url);
          }
        } catch (e) {
          console.log("Post images table might not exist:", e);
        }

        // Get tags for the post (if the table exists, otherwise empty array)
        let tags: string[] = [];
        try {
          const { data: tagData } = await supabase
            .from("post_tags")
            .select("tag")
            .eq("post_id", post.id);

          if (tagData && tagData.length > 0) {
            tags = tagData.map((t) => t.tag);
          }
        } catch (e) {
          console.log("Post tags table might not exist:", e);
        }

        // Check if the post is liked by the current user
        let liked = false;
        try {
          if (currentUserId) {
            const { data: likeData } = await supabase
              .from("post_likes")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", currentUserId)
              .single();

            liked = !!likeData;
          }
        } catch (e) {
          console.log("Post likes table might not exist:", e);
        }

        // Check if the post is saved by the current user
        let saved = false;
        try {
          if (currentUserId) {
            const { data: saveData } = await supabase
              .from("post_saves")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", currentUserId)
              .single();

            saved = !!saveData;
          }
        } catch (e) {
          console.log("Post saves table might not exist:", e);
        }

        const author = authorsMap.get(post.author_id) || {
          full_name: "Unknown Author",
          avatar_url: null,
          title: null,
          specialization: null,
        };

        return {
          id: post.id,
          author_id: post.author_id,
          author_name: author.full_name,
          author_avatar: author.avatar_url,
          author_title: author.title || author.specialization,
          content: post.content,
          images: images,
          tags: tags,
          likes_count: post.likes || 0,
          created_at: post.created_at,
          liked: liked,
          saved: saved,
        };
      })
    );

    return enhancedPosts;
  } catch (e) {
    console.error("Error in fetchTherapistPosts:", e);
    return [];
  }
};

// --- Hook for fetching posts ---
export function useTherapistPosts() {
  return useQuery({
    queryKey: ["therapist-posts"],
    queryFn: fetchTherapistPosts,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60, // 1 minute
  });
}

// --- Toggle post like ---
const togglePostLike = async ({
  postId,
  isCurrentlyLiked,
}: {
  postId: string;
  isCurrentlyLiked: boolean;
}): Promise<void> => {
  // Get current user
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user?.id) {
    console.error("Authentication error:", userError);
    toast.error("You must be logged in to like posts");
    throw new Error("Not authenticated");
  }

  const userId = userData.user.id;

  try {
    if (isCurrentlyLiked) {
      // Unlike: Delete the like
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (error) throw error;

      // Decrement likes count
      await decrementValue(postId);
    } else {
      // Like: Insert new like
      const { error } = await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: userId,
      });

      if (error) throw error;

      // Increment likes count
      await incrementValue(postId);
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
};

export function useTogglePostLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: togglePostLike,
    onMutate: async ({ postId, isCurrentlyLiked }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["therapist-posts"] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData(["therapist-posts"]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["therapist-posts"],
        (old: TherapistPost[] | undefined) => {
          if (!old) return old;

          return old.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  liked: !isCurrentlyLiked,
                  likes_count: isCurrentlyLiked
                    ? post.likes_count - 1
                    : post.likes_count + 1,
                }
              : post
          );
        }
      );

      // Return a context object with the snapshotted value
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPosts) {
        queryClient.setQueryData(["therapist-posts"], context.previousPosts);
      }
      toast.error("Failed to update like status");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["therapist-posts"] });
    },
  });
}

// --- Toggle post save ---
const togglePostSave = async ({
  postId,
  isCurrentlySaved,
}: {
  postId: string;
  isCurrentlySaved: boolean;
}): Promise<void> => {
  // Get current user
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user?.id) {
    console.error("Authentication error:", userError);
    toast.error("You must be logged in to save posts");
    throw new Error("Not authenticated");
  }

  const userId = userData.user.id;

  try {
    if (isCurrentlySaved) {
      // Unsave: Delete the save
      const { error } = await supabase
        .from("post_saves")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (error) throw error;
    } else {
      // Save: Insert new save
      const { error } = await supabase.from("post_saves").insert({
        post_id: postId,
        user_id: userId,
      });

      if (error) throw error;
    }
  } catch (error) {
    console.error("Error toggling save:", error);
    throw error;
  }
};

export function useTogglePostSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: togglePostSave,
    onMutate: async ({ postId, isCurrentlySaved }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["therapist-posts"] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData(["therapist-posts"]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["therapist-posts"],
        (old: TherapistPost[] | undefined) => {
          if (!old) return old;

          return old.map((post) =>
            post.id === postId ? { ...post, saved: !isCurrentlySaved } : post
          );
        }
      );

      // Return a context object with the snapshotted value
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPosts) {
        queryClient.setQueryData(["therapist-posts"], context.previousPosts);
      }
      toast.error("Failed to update save status");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["therapist-posts"] });
    },
  });
}

// --- Creating a Therapist Post - Original version ---
const createTherapistPost = async (
  postData: NewTherapistPostData
): Promise<string> => {
  console.log("Starting createTherapistPost with data:", postData);

  const { content, tags, images } = postData;

  try {
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user?.id) {
      console.error("Authentication error:", userError);
      toast.error("You must be logged in to create posts");
      throw new Error("Not authenticated");
    }

    const userId = userData.user.id;
    console.log("Creating post for user:", userId);

    // 1. Create the post in therapist_posts table as requested by the user
    const { data: newPosts, error: postError } = await supabase
      .from("therapist_posts")
      .insert([
        {
          author_id: userId,
          content: content,
          likes: 0,
          comments: 0,
          shares: 0,
        },
      ])
      .select();

    if (postError) {
      console.error("Error creating post:", postError);
      toast.error("Failed to create post");
      throw postError;
    }

    if (!newPosts || newPosts.length === 0) {
      console.error("No post returned after creation");
      toast.error("Failed to create post - no data returned");
      throw new Error("No post data returned");
    }

    const postId = newPosts[0].id;
    console.log("Post created with ID:", postId);

    // 2. Insert tags
    if (tags && tags.length > 0) {
      console.log("Adding tags:", tags);
      const tagRows = tags.map((tag) => ({
        post_id: postId,
        tag,
      }));

      const { error: tagsError } = await supabase
        .from("post_tags")
        .insert(tagRows);

      if (tagsError) {
        console.error("Error adding tags:", tagsError);
        // Continue with the post creation even if tags failed
      } else {
        console.log("Tags added successfully");
      }
    }

    // 3. Insert images
    if (images && images.length > 0) {
      console.log("Adding images:", images);
      const imageRows = images.map((url, index) => ({
        post_id: postId,
        image_url: url,
        position: index,
      }));

      const { error: imagesError } = await supabase
        .from("post_images")
        .insert(imageRows);

      if (imagesError) {
        console.error("Error adding images:", imagesError);
        // Continue with the post creation even if images failed
      } else {
        console.log("Images added successfully");
      }
    }

    console.log("Post creation complete:", postId);
    return postId;
  } catch (error) {
    console.error("Unexpected error in createTherapistPost:", error);
    toast.error("An unexpected error occurred while creating the post");
    throw error;
  }
};

export function useCreateTherapistPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTherapistPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["therapist-posts"] });
      toast.success("Post created successfully!");
    },
    onError: (error) => {
      console.error("Mutation error creating therapist post:", error);
      toast.error("Failed to create post. Please try again.");
    },
  });
}

// --- Creating a Therapist Post - Simplified version ---
const createTherapistPostSimple = async (
  postData: NewTherapistPostData
): Promise<string> => {
  console.log(
    "Starting SIMPLE post creation with data:",
    JSON.stringify(postData)
  );
  const { content } = postData;

  // Get the current user
  const userResponse = await supabase.auth.getUser();

  if (!userResponse?.data?.user?.id) {
    toast.error("You must be logged in to create a post");
    throw new Error("User not authenticated");
  }

  const userId = userResponse.data.user.id;

  // Insert ONLY the post itself with minimal fields
  console.log("Simple post insert attempt for userId:", userId);
  const { data, error } = await supabase
    .from("therapist_posts")
    .insert({
      author_id: userId,
      content: content,
      likes: 0,
      comments: 0,
      shares: 0,
    })
    .select("id")
    .single();

  console.log("Simple post creation result:", { data, error });

  if (error) {
    console.error("Error in simple post creation:", error);
    toast.error(`Failed to create post: ${error.message}`);
    throw error;
  }

  if (!data) {
    console.error("No data returned from simple post creation");
    toast.error("Failed to create post - no data returned");
    throw new Error("No data returned");
  }

  console.log("Post created successfully with ID:", data.id);
  return data.id;
};

export function useCreateTherapistPostSimple() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTherapistPostSimple,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["therapist-posts"] });
      toast.success("Post created successfully!");
    },
    onError: (error) => {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
    },
  });
}

// --- Creating a Therapist Post - Ultra Simple version ---
const createTherapistPostDirect = async (
  postData: NewTherapistPostData
): Promise<string> => {
  console.log(
    "Starting DIRECT SQL post creation with data:",
    JSON.stringify(postData)
  );
  const { content } = postData;

  // Get the current user
  const userResponse = await supabase.auth.getUser();

  if (!userResponse?.data?.user?.id) {
    toast.error("You must be logged in to create a post");
    throw new Error("User not authenticated");
  }

  const userId = userResponse.data.user.id;
  console.log("Attempting direct SQL insertion for user:", userId);

  // Try a direct SQL insert
  const { data, error } = await supabase.rpc("create_post_direct", {
    p_content: content,
    p_author_id: userId,
  });

  console.log("Direct SQL insert result:", { data, error });

  if (error) {
    console.error("Error in direct SQL insert:", error);
    toast.error(`Failed to create post: ${error.message}`);
    throw error;
  }

  if (!data) {
    console.error("No data returned from direct SQL insert");
    toast.error("Failed to create post - no data returned");
    throw new Error("No data returned");
  }

  console.log("Post created successfully with ID:", data);
  return data;
};

export function useCreateTherapistPostDirect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTherapistPostDirect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["therapist-posts"] });
      toast.success("Post created successfully with direct SQL!");
    },
    onError: (error) => {
      console.error("Error creating post with direct SQL:", error);
      toast.error("Failed to create post with direct SQL. Please try again.");
    },
  });
}

// Helper functions for incrementing/decrementing

// Create a function to increment a number column in a table
const incrementValue = async (postId: string) => {
  try {
    const { data: post } = await supabase
      .from("therapist_posts")
      .select("likes")
      .eq("id", postId)
      .single();

    if (post) {
      const newValue = (post.likes || 0) + 1;
      await supabase
        .from("therapist_posts")
        .update({ likes: newValue })
        .eq("id", postId);
    }
  } catch (error) {
    console.error("Error incrementing value:", error);
  }
};

// Create a function to decrement a number column in a table
const decrementValue = async (postId: string) => {
  try {
    const { data: post } = await supabase
      .from("therapist_posts")
      .select("likes")
      .eq("id", postId)
      .single();

    if (post) {
      const newValue = Math.max(0, (post.likes || 0) - 1);
      await supabase
        .from("therapist_posts")
        .update({ likes: newValue })
        .eq("id", postId);
    }
  } catch (error) {
    console.error("Error decrementing value:", error);
  }
};
