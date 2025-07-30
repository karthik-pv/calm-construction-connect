import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Heart, Video, Music } from "lucide-react";
import { motion } from "framer-motion";
import { useAnxietyCalmer, AnxietyCalmerMedia } from "@/hooks/useAnxietyCalmer";
import { MediaPlayer } from "@/components/shared/MediaPlayer";

export default function AnxietyCalmer() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedMedia, setSelectedMedia] = useState<AnxietyCalmerMedia | null>(
    null
  );
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  const { data: mediaItems, isLoading, error } = useAnxietyCalmer();

  // Debug: Log media items when they change
  useEffect(() => {
    if (mediaItems) {
      console.log("Media items loaded:", mediaItems);
      mediaItems.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          name: item.name,
          duration: item.duration,
          media_type: item.media_type,
          thumbnail_url: item.thumbnail_url,
        });
      });
    }
  }, [mediaItems]);

  // Filter media based on active tab
  const filteredMedia = mediaItems
    ? activeTab === "all"
      ? mediaItems
      : activeTab === "favorites"
      ? mediaItems.filter((item) => favorites.includes(item.id))
      : mediaItems.filter((item) => item.media_type === activeTab)
    : [];

  const handlePlayMedia = (media: AnxietyCalmerMedia) => {
    setSelectedMedia(media);
    setIsPlayerOpen(true);
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedMedia(null);
  };

  const toggleFavorite = (mediaId: string) => {
    if (favorites.includes(mediaId)) {
      setFavorites(favorites.filter((id) => id !== mediaId));
    } else {
      setFavorites([...favorites, mediaId]);
    }
  };

  const formatTime = (seconds: number | null) => {
    console.log("Formatting time for duration:", seconds);
    if (!seconds || seconds <= 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getThumbnailUrl = (media: AnxietyCalmerMedia) => {
    // Use the provided thumbnail if available
    if (media.thumbnail_url) {
      return media.thumbnail_url;
    }

    // Fallback to default thumbnails based on media type only if no thumbnail provided
    if (media.media_type === "video") {
      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop";
    } else {
      return "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop";
    }
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <PageTitle
            title="Anxiety Calmer"
            subtitle="Relax with soothing sounds and guided meditations"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted" />
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <PageTitle
            title="Anxiety Calmer"
            subtitle="Relax with soothing sounds and guided meditations"
          />
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Error loading media. Please try again later.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <PageTitle
          title="Anxiety Calmer"
          subtitle="Relax with soothing sounds and guided meditations"
        />

        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>

          {/* Media List */}
          <TabsContent value={activeTab} className="mt-0">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredMedia.length > 0 ? (
                filteredMedia.map((media) => (
                  <motion.div key={media.id} variants={item}>
                    <Card className="overflow-hidden hover:border-primary/50 transition-all duration-300 glass-card">
                      <div
                        className="h-48 bg-cover bg-center relative"
                        style={{
                          backgroundImage: `url(${getThumbnailUrl(media)})`,
                        }}
                      >
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-16 w-16 rounded-full glass-button text-white border border-white/20"
                            onClick={() => handlePlayMedia(media)}
                          >
                            {media.media_type === "video" ? (
                              <Video className="h-8 w-8" />
                            ) : (
                              <Music className="h-8 w-8" />
                            )}
                          </Button>
                        </div>
                        {media.media_type === "video" && (
                          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            Video
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {media.name}
                            </CardTitle>
                            <CardDescription>
                              {media.description ||
                                `${
                                  media.media_type === "video"
                                    ? "Video"
                                    : "Audio"
                                } meditation`}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => toggleFavorite(media.id)}
                          >
                            <Heart
                              className={`h-5 w-5 ${
                                favorites.includes(media.id)
                                  ? "fill-primary text-primary"
                                  : ""
                              }`}
                            />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {media.media_type === "video" ? (
                              <Video className="h-3 w-3" />
                            ) : (
                              <Music className="h-3 w-3" />
                            )}
                            <span className="capitalize">
                              {media.media_type}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">
                    {activeTab === "favorites"
                      ? "No favorite media found"
                      : "No media found"}
                  </p>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Media Player Popup */}
        <MediaPlayer
          media={selectedMedia}
          isOpen={isPlayerOpen}
          onClose={handleClosePlayer}
        />
      </div>
    </DashboardLayout>
  );
}
