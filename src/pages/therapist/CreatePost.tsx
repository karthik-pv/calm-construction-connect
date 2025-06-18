import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FilePlus, Image, Loader2, Video, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export default function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");

  const handleAddTag = () => {
    const trimmedTag = tag.trim().toLowerCase().replace(/\s+/g, "");
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTag("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImagePreviews = filesArray.map((file) =>
        URL.createObjectURL(file)
      );

      setSelectedImages([...selectedImages, ...filesArray]);
      setImagePreviewUrls([...imagePreviewUrls, ...newImagePreviews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...selectedImages];
    const newPreviews = [...imagePreviewUrls];

    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[index]);

    newImages.splice(index, 1);
    newPreviews.splice(index, 1);

    setSelectedImages(newImages);
    setImagePreviewUrls(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Please add some content to your post");
      return;
    }

    setSubmitting(true);

    try {
      // In a real app, you would upload the post to a database
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Post created successfully!");
      navigate("/therapist/posts");
    } catch (error) {
      toast.error("Failed to create post. Please try again.");
      console.error("Error creating post:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <PageTitle
          title="Create Post"
          subtitle="Share valuable mental health insights with construction workers"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto mt-6"
        >
          <Card className="glass-card">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>New Post</CardTitle>
                <CardDescription>
                  Create a post to share mental health advice, resources, or
                  insights
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="content">Post Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Share mental health advice, coping strategies, or resources..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    className="glass-input resize-y"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      placeholder="Add tags (e.g. anxiety, stress)"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="glass-input"
                    />
                    <Button
                      type="button"
                      className="glass-button"
                      onClick={handleAddTag}
                      disabled={!tag.trim()}
                    >
                      Add
                    </Button>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((t) => (
                        <Badge key={t} variant="secondary">
                          #{t}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Attach Images</Label>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="images"
                      className="glass-button cursor-pointer flex items-center gap-2"
                    >
                      <Image className="h-5 w-5" />
                      <span>
                        Upload Image
                        {selectedImages.length > 0
                          ? `s (${selectedImages.length})`
                          : ""}
                      </span>
                    </label>
                    <input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>

                  {imagePreviewUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {imagePreviewUrls.map((previewUrl, index) => (
                        <div
                          key={index}
                          className="relative rounded-md overflow-hidden group"
                        >
                          <img
                            src={previewUrl}
                            alt={`Preview ${index + 1}`}
                            className="object-cover w-full h-32"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video">Video URL (YouTube or Vimeo)</Label>
                  <Input
                    id="video"
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="glass-input"
                  />

                  {videoUrl && (
                    <div className="mt-2 rounded-md overflow-hidden">
                      <div className="aspect-video rounded-lg overflow-hidden glass-card flex items-center justify-center">
                        <Video className="h-12 w-12 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground ml-2">
                          Video preview will appear in the published post
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="glass-button"
                  onClick={() => navigate("/therapist/posts")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="glass-button"
                  disabled={submitting || !content.trim()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <FilePlus className="mr-2 h-4 w-4" />
                      Publish Post
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
