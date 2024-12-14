import React, { useRef, useEffect, useState } from 'react'

import { PictureInPicture, SkipBack, Play, Pause, SkipForward, Volume2, VolumeX, Rewind, FastForward, X } from 'lucide-react'
import { usePlayer } from './context/PlayerContext'
import { useAudio } from './hooks/useAudio'
import { Button } from './shadcn/ui/button'
import { Slider } from './shadcn/ui/slider'

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

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
        nextTrack,
        previousTrack,
        skipForward,
        skipBackward
    } = usePlayer()
    const audioRef = useAudio()
    const videoRef = useRef<HTMLVideoElement>(null)



    const togglePlay = () => setIsPlaying(!isPlaying)

    const handleVolumeChange = (newVolume: number[]) => {
        setVolume(newVolume[0]!)
    }

    const handleTimeChange = (newTime: number[]) => {
        setCurrentTime(newTime[0]!)
    }

    // const togglePIP = async () => {
    //     if (!videoRef.current) return

    //     try {
    //         if (isPIP) {
    //             await document.exitPictureInPicture()
    //         } else {
    //             await videoRef.current.requestPictureInPicture()
    //         }
    //         setIsPIP(!isPIP)
    //     } catch (error) {
    //         console.error('Failed to toggle Picture-in-Picture mode:', error)
    //     }
    // }

    console.log('currentTrack', currentTrack)
    console.log('isPlaying', isPlaying)


    if (!currentTrack || !isPlayerOpen) return null

    // const ScrollingText: React.FC<{ text: string }> = ({ text }) => {
    //     const containerRef = useRef<HTMLDivElement>(null);
    //     const textRef = useRef<HTMLDivElement>(null);
    //     const [isOverflowing, setIsOverflowing] = useState(false);
    //     const [animationDuration, setAnimationDuration] = useState(0);

    //     useEffect(() => {
    //         if (containerRef.current && textRef.current) {
    //             const isOverflow = textRef.current.offsetWidth > containerRef.current.offsetWidth;
    //             setIsOverflowing(isOverflow);
    //             if (isOverflow) {
    //                 const duration = textRef.current.offsetWidth / 10; // Adjust speed here
    //                 setAnimationDuration(duration);
    //             }
    //         }
    //     }, [text]);

    //     return (
    //         <div ref={containerRef} className="w-full overflow-hidden">
    //             <div
    //                 ref={textRef}
    //                 className={`inline-block whitespace-nowrap ${isOverflowing ? 'animate-scrolling-text' : ''
    //                     }`}
    //                 style={
    //                     isOverflowing
    //                         ? {
    //                             animationDuration: `${animationDuration}s`,
    //                             animationDelay: '2s',
    //                         }
    //                         : {}
    //                 }
    //             >
    //                 {text}
    //             </div>
    //         </div>
    //     );
    // };
    return (
        <div className="absolute bottom-1 left-0 right-0 bg-background border-t rounded-t-lg border-border p-2 flex flex-col items-center justify-center  max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2 w-full">
                <div className="flex items-center space-x-4">
                    <img src={currentTrack.asset.thumbnail} alt={currentTrack.asset.name} className="w-12 h-12 rounded-md" />
                    <div className="space-y-1 max-w-[300px] sm:max-w-[200px]">
                        <h3 className="font-medium">{currentTrack.asset.name} </h3>
                        <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
                    </div>

                </div>

                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" className='hidden md:flex' onClick={skipBackward}>
                        <Rewind className="h-4 w-4" />
                    </Button>
                    {/* <Button variant="ghost" size="icon" onClick={previousTrack}>
                        <SkipBack className="h-6 w-6" />
                    </Button> */}
                    <Button variant="ghost" size="icon" onClick={togglePlay} className='hidden md:flex'>
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                    {/* <Button variant="ghost" size="icon" onClick={nextTrack}>
                        <SkipForward className="h-6 w-6" />
                    </Button> */}
                    <Button variant="ghost" size="icon" onClick={skipForward} className='hidden md:flex'>
                        <FastForward className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={togglePlay} className='flex md:hidden'>
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                    <div className="flex items-center space-x-2">
                        {volume > 0 ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                        <Slider
                            className="w-24 hidden md:flex"
                            value={[volume]}
                            max={1}
                            step={0.01}
                            onValueChange={handleVolumeChange}
                        />
                    </div>
                    {/* <Button variant="ghost" size="icon" onClick={togglePIP}>
                        <PictureInPicture className="h-6 w-6" />
                    </Button> */}
                    <Button variant="ghost" size="icon" onClick={() => {
                        setIsPlayerOpen(false)
                        setIsPlaying(false)
                    }}>
                        <X className="h-6 w-6" />
                    </Button>
                </div>
            </div>
            <div className="flex items-center space-x-4 w-full">
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
    )
}

