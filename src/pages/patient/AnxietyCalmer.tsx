
import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, SkipForward, SkipBack, Volume2, Heart } from "lucide-react";
import { motion } from "framer-motion";

// Types
interface Track {
  id: string;
  title: string;
  artist: string;
  category: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
}

// Audio tracks data
const tracks: Track[] = [
  {
    id: "1",
    title: "Calm Ocean Waves",
    artist: "Nature Sounds",
    category: "nature",
    duration: 180,
    coverUrl: "https://images.unsplash.com/photo-1509477887414-681937645173",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_017b5723a6.mp3",
  },
  {
    id: "2",
    title: "Gentle Rain",
    artist: "Nature Sounds",
    category: "nature",
    duration: 240,
    coverUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e695",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d16587ea2b.mp3",
  },
  {
    id: "3",
    title: "Forest Birds",
    artist: "Nature Sounds",
    category: "nature",
    duration: 210,
    coverUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b",
    audioUrl: "https://cdn.pixabay.com/download/audio/2021/09/06/audio_88447e7def.mp3",
  },
  {
    id: "4",
    title: "Deep Relaxation",
    artist: "Mindfulness Meditation",
    category: "meditation",
    duration: 300,
    coverUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/27/audio_d59ce49a80.mp3",
  },
  {
    id: "5",
    title: "Stress Relief",
    artist: "Mindfulness Meditation",
    category: "meditation",
    duration: 360,
    coverUrl: "https://images.unsplash.com/photo-1528715471939-faa64ecb0f8d",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/04/27/audio_c9fff8db8e.mp3",
  },
  {
    id: "6",
    title: "Anxiety Reduction",
    artist: "Mindfulness Meditation",
    category: "meditation",
    duration: 420,
    coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    audioUrl: "https://cdn.pixabay.com/download/audio/2021/12/11/audio_bc0842dd4c.mp3",
  },
  {
    id: "7",
    title: "Peaceful Piano",
    artist: "Classical Relaxation",
    category: "music",
    duration: 240,
    coverUrl: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/20/audio_a4dc0b7e01.mp3",
  },
  {
    id: "8",
    title: "Ambient Melody",
    artist: "Ambient Sounds",
    category: "music",
    duration: 300,
    coverUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/16/audio_7b3ceaf796.mp3",
  },
  {
    id: "9",
    title: "Deep Focus",
    artist: "Concentration Music",
    category: "music",
    duration: 360,
    coverUrl: "https://images.unsplash.com/photo-1527766833261-b09c3163a791",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_d0c6ff1bfc.mp3",
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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filter tracks based on active tab
  const filteredTracks = activeTab === "all" 
    ? tracks 
    : activeTab === "favorites" 
      ? tracks.filter(track => favorites.includes(track.id))
      : tracks.filter(track => track.category === activeTab);
      
  useEffect(() => {
    if (audioRef.current) {
      // Set up audio events
      audioRef.current.addEventListener('timeupdate', updateProgress);
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current!.duration);
      });
      audioRef.current.addEventListener('ended', handleTrackEnd);
      
      // Set volume
      audioRef.current.volume = volume / 100;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateProgress);
        audioRef.current.removeEventListener('ended', handleTrackEnd);
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentTrack]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);
  
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
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play();
      }
    }, 100);
  };
  
  const togglePlayPause = () => {
    if (!currentTrack) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const playNextTrack = () => {
    if (!currentTrack) return;
    
    const currentIndex = filteredTracks.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % filteredTracks.length;
    playTrack(filteredTracks[nextIndex]);
  };
  
  const playPreviousTrack = () => {
    if (!currentTrack) return;
    
    const currentIndex = filteredTracks.findIndex(track => track.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + filteredTracks.length) % filteredTracks.length;
    playTrack(filteredTracks[prevIndex]);
  };
  
  const seekTo = (percent: number) => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      const seekTime = audioRef.current.duration * (percent / 100);
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };
  
  const toggleFavorite = (trackId: string) => {
    if (favorites.includes(trackId)) {
      setFavorites(favorites.filter(id => id !== trackId));
    } else {
      setFavorites([...favorites, trackId]);
    }
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
        <PageTitle title="Anxiety Calmer" subtitle="Relax with soothing sounds and guided meditations" />
        
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
                        currentTrack?.id === track.id ? 'border-primary' : 'border-border'
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
                            <CardTitle className="text-lg">{track.title}</CardTitle>
                            <CardDescription>{track.artist}</CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => toggleFavorite(track.id)}
                          >
                            <Heart 
                              className={`h-5 w-5 ${favorites.includes(track.id) ? 'fill-primary text-primary' : ''}`} 
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
              <audio
                ref={audioRef}
                src={currentTrack.audioUrl}
                onTimeUpdate={updateProgress}
                onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
                onEnded={handleTrackEnd}
              />
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 flex items-center gap-3">
                    <div 
                      className="h-12 w-12 rounded-md bg-cover bg-center"
                      style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
                    ></div>
                    <div className="truncate">
                      <h4 className="font-medium truncate">{currentTrack.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
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
                          value={[(!isNaN(duration) && duration > 0) ? (currentTime / duration) * 100 : 0]}
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
