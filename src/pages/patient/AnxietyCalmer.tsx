import { useState, useRef, useEffect } from "react";
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
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Heart,
} from "lucide-react";
import { motion } from "framer-motion";

// SoundCloud Widget API types
declare global {
  interface Window {
    SC: any;
  }
}

// Types
interface Track {
  id: string;
  title: string;
  artist: string;
  category: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
  isSoundCloud?: boolean;
  soundCloudTrackId?: string;
}

// Audio tracks data
const tracks: Track[] = [
  {
    id: "1",
    title: "Moonlit Waves",
    artist: "Ocean Sounds",
    category: "nature",
    duration: 180,
    coverUrl: "https://images.unsplash.com/photo-1509477887414-681937645173",
    audioUrl:
      "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/2014549711&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false",
    isSoundCloud: true,
    soundCloudTrackId: "2014549711",
  },
  {
    id: "2",
    title: "Gentle Rain",
    artist: "Nature Sounds",
    category: "nature",
    duration: 240,
    coverUrl:
      "https://cdn.pixabay.com/photo/2018/02/09/13/49/drops-3141603_1280.jpg",
    audioUrl:
      "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/674521943&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false",
    isSoundCloud: true,
    soundCloudTrackId: "674521943",
  },
  {
    id: "3",
    title: "Forest Birds",
    artist: "Nature Sounds",
    category: "nature",
    duration: 210,
    coverUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b",
    audioUrl:
      "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1639052265&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false",
    isSoundCloud: true,
    soundCloudTrackId: "1639052265",
  },
  {
    id: "4",
    title: "Deep Relaxation",
    artist: "Mindfulness Meditation",
    category: "meditation",
    duration: 300,
    coverUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
    audioUrl:
      "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/2087286291&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false",
    isSoundCloud: true,
    soundCloudTrackId: "2087286291",
  },
  {
    id: "5",
    title: "Stress Relief",
    artist: "Mindfulness Meditation",
    category: "meditation",
    duration: 360,
    coverUrl:
      "https://img.freepik.com/photos-gratuite/vue-fleurs-derriere-verre-transparent-gouttes-eau_23-2149478587.jpg",
    audioUrl:
      "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/2012993859&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false",
    isSoundCloud: true,
    soundCloudTrackId: "2012993859",
  },
  {
    id: "6",
    title: "Anxiety Reduction",
    artist: "Mindfulness Meditation",
    category: "meditation",
    duration: 420,
    coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    audioUrl:
      "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1933118579&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false",
    isSoundCloud: true,
    soundCloudTrackId: "1933118579",
  },
  {
    id: "7",
    title: "Peaceful Piano",
    artist: "Classical Relaxation",
    category: "music",
    duration: 240,
    coverUrl: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0",
    audioUrl:
      "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/253802512&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false",
    isSoundCloud: true,
    soundCloudTrackId: "253802512",
  },
  {
    id: "8",
    title: "Ambient Melody",
    artist: "Ambient Sounds",
    category: "music",
    duration: 300,
    coverUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
    audioUrl:
      "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1470435082&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false",
    isSoundCloud: true,
    soundCloudTrackId: "1470435082",
  },
  {
    id: "9",
    title: "Deep Focus",
    artist: "Concentration Music",
    category: "music",
    duration: 360,
    coverUrl: "https://images.unsplash.com/photo-1527766833261-b09c3163a791",
    audioUrl:
      "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1474042429&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false",
    isSoundCloud: true,
    soundCloudTrackId: "1474042429",
  },
];

export default function AnxietyCalmer() {
  const [activeTab, setActiveTab] = useState("all");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [soundCloudWidget, setSoundCloudWidget] = useState<any>(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const widgetRef = useRef<any>(null);

  // Filter tracks based on active tab
  const filteredTracks =
    activeTab === "all"
      ? tracks
      : activeTab === "favorites"
      ? tracks.filter((track) => favorites.includes(track.id))
      : tracks.filter((track) => track.category === activeTab);

  // Load SoundCloud Widget API
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.onload = () => {
      console.log("SoundCloud Widget API loaded");
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Cleanup function for SoundCloud widget
  const cleanupSoundCloudWidget = () => {
    if (widgetRef.current) {
      try {
        widgetRef.current.pause();
        // Unbind all events
        if (window.SC && window.SC.Widget && window.SC.Widget.Events) {
          widgetRef.current.unbind(window.SC.Widget.Events.READY);
          widgetRef.current.unbind(window.SC.Widget.Events.PLAY);
          widgetRef.current.unbind(window.SC.Widget.Events.PAUSE);
          widgetRef.current.unbind(window.SC.Widget.Events.FINISH);
          widgetRef.current.unbind(window.SC.Widget.Events.PLAY_PROGRESS);
        }
      } catch (error) {
        console.log("Error cleaning up widget:", error);
      }
    }
    widgetRef.current = null;
    setSoundCloudWidget(null);
    setIsWidgetReady(false);
  };

  // Initialize SoundCloud widget when iframe loads
  useEffect(() => {
    if (currentTrack?.isSoundCloud && iframeRef.current && window.SC) {
      // Clean up previous widget
      cleanupSoundCloudWidget();

      // Small delay to ensure iframe is loaded
      const timeout = setTimeout(() => {
        if (iframeRef.current) {
          const widget = window.SC.Widget(iframeRef.current);
          widgetRef.current = widget;
          setSoundCloudWidget(widget);

          widget.bind(window.SC.Widget.Events.READY, () => {
            console.log("SoundCloud widget ready for:", currentTrack.title);
            setIsWidgetReady(true);

            widget.bind(window.SC.Widget.Events.PLAY, () => {
              setIsPlaying(true);
            });

            widget.bind(window.SC.Widget.Events.PAUSE, () => {
              setIsPlaying(false);
            });

            widget.bind(window.SC.Widget.Events.FINISH, () => {
              setIsPlaying(false);
              // Use setTimeout to avoid circular dependency
              setTimeout(() => {
                playNextTrack();
              }, 100);
            });

            widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data: any) => {
              setCurrentTime(data.currentPosition / 1000);
            });

            widget.getDuration((duration: number) => {
              setDuration(duration / 1000);
            });

            // Set initial volume
            widget.setVolume(volume);

            // Auto-play the track
            widget.play();
          });
        }
      }, 300);

      return () => {
        clearTimeout(timeout);
      };
    } else if (!currentTrack?.isSoundCloud) {
      // Clean up SoundCloud widget when switching to regular audio
      cleanupSoundCloudWidget();
    }
  }, [currentTrack?.id]); // Use currentTrack.id instead of currentTrack to avoid unnecessary re-renders

  useEffect(() => {
    if (audioRef.current && !currentTrack?.isSoundCloud) {
      // Set up audio events
      audioRef.current.addEventListener("timeupdate", updateProgress);
      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current!.duration);
      });
      audioRef.current.addEventListener("ended", handleTrackEnd);

      // Set volume
      audioRef.current.volume = volume / 100;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", updateProgress);
        audioRef.current.removeEventListener("ended", handleTrackEnd);
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentTrack?.id]);

  useEffect(() => {
    if (audioRef.current && !currentTrack?.isSoundCloud) {
      audioRef.current.volume = volume / 100;
    } else if (
      soundCloudWidget &&
      currentTrack?.isSoundCloud &&
      isWidgetReady
    ) {
      soundCloudWidget.setVolume(volume);
    }
  }, [volume, soundCloudWidget, currentTrack, isWidgetReady]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupSoundCloudWidget();
    };
  }, []);

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleTrackEnd = () => {
    playNextTrack();
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const playTrack = async (track: Track) => {
    try {
      console.log(
        "Playing track:",
        track.title,
        "Type:",
        track.isSoundCloud ? "SoundCloud" : "Regular"
      );

      // Stop current playback first
      if (currentTrack) {
        if (currentTrack.isSoundCloud && soundCloudWidget) {
          soundCloudWidget.pause();
        } else if (audioRef.current) {
          audioRef.current.pause();
        }
      }

      // Reset states
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsWidgetReady(false);

      // Set new track
      setCurrentTrack(track);

      if (!track.isSoundCloud) {
        // Regular audio file
        // Wait a moment for the audio element to update
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (audioRef.current) {
          audioRef.current.load(); // Reload the audio element

          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
          }
        }
      }
      // For SoundCloud tracks, playback will be handled in the useEffect when widget is ready
    } catch (error) {
      console.error("Error playing track:", error);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    if (!currentTrack) return;

    try {
      if (currentTrack.isSoundCloud && soundCloudWidget && isWidgetReady) {
        // SoundCloud track
        if (isPlaying) {
          soundCloudWidget.pause();
        } else {
          soundCloudWidget.play();
        }
      } else if (audioRef.current) {
        // Regular audio file
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
          }
        }
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
      setIsPlaying(false);
    }
  };

  const playNextTrack = () => {
    if (!currentTrack) return;

    const currentIndex = filteredTracks.findIndex(
      (track) => track.id === currentTrack.id
    );
    const nextIndex = (currentIndex + 1) % filteredTracks.length;
    playTrack(filteredTracks[nextIndex]);
  };

  const playPreviousTrack = () => {
    if (!currentTrack) return;

    const currentIndex = filteredTracks.findIndex(
      (track) => track.id === currentTrack.id
    );
    const prevIndex =
      (currentIndex - 1 + filteredTracks.length) % filteredTracks.length;
    playTrack(filteredTracks[prevIndex]);
  };

  const seekTo = (percent: number) => {
    if (currentTrack?.isSoundCloud && soundCloudWidget && isWidgetReady) {
      // SoundCloud track
      const seekTime = duration * 1000 * (percent / 100); // Convert to milliseconds
      soundCloudWidget.seekTo(seekTime);
    } else if (audioRef.current && !isNaN(audioRef.current.duration)) {
      // Regular audio file
      const seekTime = audioRef.current.duration * (percent / 100);
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const toggleFavorite = (trackId: string) => {
    if (favorites.includes(trackId)) {
      setFavorites(favorites.filter((id) => id !== trackId));
    } else {
      setFavorites([...favorites, trackId]);
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
            <TabsTrigger value="nature">Nature</TabsTrigger>
            <TabsTrigger value="meditation">Meditation</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
          </TabsList>

          {/* Track List */}
          <TabsContent value={activeTab} className="mt-0">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredTracks.length > 0 ? (
                filteredTracks.map((track) => (
                  <motion.div key={track.id} variants={item}>
                    <Card
                      className={`overflow-hidden hover:border-primary/50 transition-all duration-300 ${
                        currentTrack?.id === track.id
                          ? "border-primary"
                          : "border-border"
                      } bg-black/40 backdrop-blur-md`}
                    >
                      <div
                        className="h-48 bg-cover bg-center relative"
                        style={{ backgroundImage: `url(${track.coverUrl})` }}
                      >
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-16 w-16 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20"
                            onClick={() => playTrack(track)}
                          >
                            <Play className="h-8 w-8" />
                          </Button>
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {track.title}
                            </CardTitle>
                            <CardDescription>{track.artist}</CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => toggleFavorite(track.id)}
                          >
                            <Heart
                              className={`h-5 w-5 ${
                                favorites.includes(track.id)
                                  ? "fill-primary text-primary"
                                  : ""
                              }`}
                            />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(track.duration)}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No tracks found</p>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Audio Player */}
        {currentTrack && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-none border-t glass-card">
              {currentTrack.isSoundCloud ? (
                <iframe
                  key={currentTrack.id}
                  ref={iframeRef}
                  width="100%"
                  height="0"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src={currentTrack.audioUrl}
                  style={{ display: "none" }}
                />
              ) : (
                <audio
                  key={currentTrack.id}
                  ref={audioRef}
                  src={currentTrack.audioUrl}
                  onTimeUpdate={updateProgress}
                  onLoadedMetadata={() =>
                    audioRef.current && setDuration(audioRef.current.duration)
                  }
                  onEnded={handleTrackEnd}
                />
              )}
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-md bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${currentTrack.coverUrl})`,
                      }}
                    ></div>
                    <div className="truncate">
                      <h4 className="font-medium truncate">
                        {currentTrack.title}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {currentTrack.artist}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-6">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-4 mb-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary"
                          onClick={playPreviousTrack}
                        >
                          <SkipBack className="h-5 w-5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full"
                          onClick={togglePlayPause}
                        >
                          {isPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary"
                          onClick={playNextTrack}
                        >
                          <SkipForward className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="w-full flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-10 text-right">
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
                        />
                        <span className="text-xs text-muted-foreground w-10">
                          {formatTime(duration)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-3 flex items-center justify-end">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        value={[volume]}
                        max={100}
                        step={1}
                        className="w-24"
                        onValueChange={(value) => setVolume(value[0])}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
