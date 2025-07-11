import { useState } from "react";
import { useAuth, UserProfile } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export function useProfile() {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile?.avatar_url || null
  );

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !profile?.id) return profile?.avatar_url || null;

    try {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("user-content")
        .upload(filePath, avatarFile);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("user-content")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload profile picture");
      return profile?.avatar_url || null;
    }
  };

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    setLoading(true);
    try {
      let avatar_url = profile?.avatar_url;

      // Upload avatar if there's a new one
      if (avatarFile) {
        try {
          const newAvatarUrl = await uploadAvatar();
          if (newAvatarUrl) {
            avatar_url = newAvatarUrl;
          }
        } catch (uploadError) {
          console.error(
            "Avatar upload failed, continuing with profile update:",
            uploadError
          );
          toast.error(
            "Could not upload profile picture, but will update other profile data"
          );
          // Continue with profile update even if avatar upload fails
        }
      }

      // Update profile with avatar URL and other data
      await updateProfile({
        ...profileData,
        avatar_url,
      });

      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    avatarPreview,
    handleAvatarChange,
    updateUserProfile,
    updatePassword,
  };
}
