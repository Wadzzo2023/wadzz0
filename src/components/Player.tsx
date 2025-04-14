import React, { useRef } from "react";

import {
  FastForward,
  Pause,
  Play,
  Rewind,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { usePlayer } from "./context/PlayerContext";
import { useAudio } from "./hooks/useAudio";
import { Button } from "./shadcn/ui/button";
import { Slider } from "./shadcn/ui/slider";

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const Player: React.FC = () => {
  const {
    isPlayerOpen,
    currentTrack,
    isPlaying,
    volume,
    isPIP,
    currentTime,
    duration,
    setIsPlayerOpen,
    setIsPlaying,
    setVolume,
    setIsPIP,
    setCurrentTime,
    setCurrentTrack,
    setCurrentAudioPlayingId,
    nextTrack,
    previousTrack,
    skipForward,
    skipBackward,

  } = usePlayer();
  const audioRef = useAudio();
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0]!);
  };

  const handleTimeChange = (newTime: number[]) => {
    setCurrentTime(newTime[0]!);
  };



  if (!currentTrack || !isPlayerOpen) return null;


  return (
    <div className="absolute bottom-1 left-0 right-0 mx-auto flex max-w-2xl flex-col items-center justify-center rounded-t-lg border-t border-border  bg-background p-2">
      <div className="mb-2 flex w-full items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={currentTrack.asset.thumbnail ?? "/images/logo.png"}
            alt={currentTrack.asset.name}
            className="h-12 w-12 rounded-md"
          />
          <div className="max-w-[300px] space-y-1 sm:max-w-[200px]">
            <h3 className="font-medium">{currentTrack.asset.name} </h3>
            <p className="truncate text-xs text-muted-foreground">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={skipBackward}
          >
            <Rewind className="h-4 w-4" />
          </Button>
          {/* <Button variant="ghost" size="icon" onClick={previousTrack}>
                        <SkipBack className="h-6 w-6" />
                    </Button> */}
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="hidden md:flex"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>
          {/* <Button variant="ghost" size="icon" onClick={nextTrack}>
                        <SkipForward className="h-6 w-6" />
                    </Button> */}
          <Button
            variant="ghost"
            size="icon"
            onClick={skipForward}
            className="hidden md:flex"
          >
            <FastForward className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="flex md:hidden"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>
          <div className="flex items-center space-x-2">
            {volume > 0 ? (
              <Volume2 className="h-6 w-6" />
            ) : (
              <VolumeX className="h-6 w-6" />
            )}
            <Slider
              className="hidden w-24 md:flex"
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
            />
          </div>
          {/* <Button variant="ghost" size="icon" onClick={togglePIP}>
                        <PictureInPicture className="h-6 w-6" />
                    </Button> */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {

              setCurrentTrack(null);
              setCurrentAudioPlayingId(null);
            }}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>
      <div className="flex w-full items-center space-x-4">
        <span className="text-sm">{formatTime(currentTime)}</span>
        <Slider
          className="flex-grow"
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={handleTimeChange}
        />
        <span className="text-sm">{formatTime(duration)}</span>
      </div>
    </div>
  );
};
