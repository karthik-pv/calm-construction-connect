import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, X } from "lucide-react";
import { AnxietyCalmerMedia } from "@/hooks/useAnxietyCalmer";

interface MediaPlayerProps {
  media: AnxietyCalmerMedia | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MediaPlayer({ media, isOpen, onClose }: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  // Reset states when media changes
  useEffect(() => {
    if (media && isOpen) {
      console.log("Loading media:", media.name, "URL:", media.media_url);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      setIsLoading(true);
      setError(null);
    }
  }, [media, isOpen]);

  // Handle volume changes
  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = volume / 100;
    }
  }, [volume]);

  const updateProgress = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      console.log("Media loaded successfully:", media?.name);
      const actualDuration = mediaRef.current.duration;
      console.log(
        "Actual media duration:",
        actualDuration,
        "Database duration:",
        media?.duration
      );

      // Use actual duration from media file if database duration is not available
      const finalDuration = media?.duration || actualDuration;
      setDuration(finalDuration);
      setIsLoading(false);
    }
  };

  const handleLoadStart = () => {
    console.log("Starting to load media:", media?.name);
    setIsLoading(true);
    setError(null);
  };

  const handleError = (e: any) => {
    console.error("Media loading error for:", media?.name, e);
    setError("Failed to load media. Please check the URL and try again.");
    setIsLoading(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlayPause = async () => {
    if (!mediaRef.current) return;

    try {
      if (isPlaying) {
        mediaRef.current.pause();
        setIsPlaying(false);
      } else {
        // Check if media is ready to play
        if (mediaRef.current.readyState >= 2) {
          // iOS-specific handling
          const playPromise = mediaRef.current.play();

          if (playPromise !== undefined) {
            try {
              await playPromise;
              setIsPlaying(true);
            } catch (playError) {
              console.error("Play failed:", playError);
              // For iOS, try setting muted first then unmuting
              if (mediaRef.current) {
                mediaRef.current.muted = true;
                try {
                  await mediaRef.current.play();
                  mediaRef.current.muted = false;
                  setIsPlaying(true);
                } catch (mutedPlayError) {
                  console.error("Muted play also failed:", mutedPlayError);
                  setError(
                    "Media not ready to play. Please wait for it to load."
                  );
                }
              }
            }
          }
        } else {
          setError("Media not ready to play. Please wait for it to load.");
        }
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
      setError("Failed to play media. Please try again.");
    }
  };

  const seekTo = (percent: number) => {
    if (mediaRef.current && !isNaN(mediaRef.current.duration)) {
      const seekTime = mediaRef.current.duration * (percent / 100);
      mediaRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const validateMediaUrl = (url: string) => {
    // Check if it's a valid URL
    try {
      new URL(url);
      return url;
    } catch {
      console.error("Invalid media URL:", url);
      return null;
    }
  };

  if (!media) return null;

  const mediaUrl = validateMediaUrl(media.media_url);
  if (!mediaUrl) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {media.name}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <p className="text-red-500">
              Invalid media URL. Please check the configuration.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {media.name}
            </DialogTitle>
          </div>
          {media.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {media.description}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Media Player */}
          <div className="relative bg-black rounded-lg overflow-hidden min-h-[300px]">
            {media.media_type === "video" ? (
              <>
                <video
                  ref={mediaRef as React.RefObject<HTMLVideoElement>}
                  src={mediaUrl}
                  className="w-full h-auto max-h-[60vh]"
                  onTimeUpdate={updateProgress}
                  onLoadedMetadata={handleLoadedMetadata}
                  onLoadStart={handleLoadStart}
                  onError={handleError}
                  onEnded={handleEnded}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  controls={false}
                  preload="metadata"
                  playsInline
                  webkit-playsinline="true"
                  x-webkit-airplay="allow"
                  muted={false}
                  crossOrigin="anonymous"
                />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p>Loading video...</p>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-white text-center">
                      <p className="text-red-400">{error}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-32 bg-gradient-to-r from-blue-500 to-purple-600">
                <div className="text-center text-white">
                  <div className="text-4xl mb-2">🎵</div>
                  <div className="text-sm">{media.name}</div>
                </div>
                <audio
                  ref={mediaRef as React.RefObject<HTMLAudioElement>}
                  src={mediaUrl}
                  onTimeUpdate={updateProgress}
                  onLoadedMetadata={handleLoadedMetadata}
                  onLoadStart={handleLoadStart}
                  onError={handleError}
                  onEnded={handleEnded}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  preload="metadata"
                  playsInline
                  webkit-playsinline="true"
                  muted={false}
                  crossOrigin="anonymous"
                />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Play/Pause Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={togglePlayPause}
                disabled={isLoading || !!error}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[
                    !isNaN(duration) && duration > 0
                      ? (currentTime / duration) * 100
                      : 0,
                  ]}
                  max={100}
                  step={1}
                  className="flex-1"
                  onValueChange={(value) => seekTo(value[0])}
                  disabled={isLoading || !!error}
                />
                <span className="text-xs text-muted-foreground w-12">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                max={100}
                step={1}
                className="w-32"
                onValueChange={(value) => setVolume(value[0])}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
