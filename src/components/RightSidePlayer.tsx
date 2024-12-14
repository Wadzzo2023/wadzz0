import React, { useRef, useEffect, useState } from 'react'

import { PictureInPicture, SkipBack, Play, Pause, SkipForward, Volume2, VolumeX, Rewind, FastForward, X } from 'lucide-react'
import { usePlayer } from './context/PlayerContext'
import { useAudio } from './hooks/useAudio'
import { Button } from './shadcn/ui/button'
import { Slider } from './shadcn/ui/slider'
import Image from 'next/image'

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export const RightSidePlayer: React.FC = () => {
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

        <div className=" flex justify-center items-center h-full">
            <div className="bg-white p-2 md:p-4 rounded-lg shadow-md ">

                <Image
                    src={currentTrack.asset.thumbnail}
                    alt={currentTrack.asset.name}
                    width={1000}
                    height={1000}
                    className="w-64 h-64   rounded-lg mb-4 shadow-lg shadow-teal-50 object-cover" />

                <h2 className="text-xl font-semibold text-center">{currentTrack.asset.name}</h2>

                <p className="text-gray-600 text-sm text-center">{currentTrack.artist}</p>

                <div className="mt-6 flex justify-center items-center">
                    <Button variant="ghost" size="icon" className='' onClick={skipBackward}>
                        <Rewind className="h-4 w-4" />
                    </Button>
                    {/* <Button variant="ghost" size="icon" onClick={previousTrack}>
                        <SkipBack className="h-6 w-6" />
                    </Button> */}
                    <Button variant="ghost" size="icon" onClick={togglePlay} className=''>
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                    {/* <Button variant="ghost" size="icon" onClick={nextTrack}>
                        <SkipForward className="h-6 w-6" />
                    </Button> */}
                    <Button variant="ghost" size="icon" onClick={skipForward} className=''>
                        <FastForward className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-2 w-24">
                        {volume > 0 ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                        <Slider
                            className="w-full "
                            value={[volume]}
                            max={1}
                            step={0.01}
                            onValueChange={handleVolumeChange}
                        />
                    </div>
                </div>


                <div className="flex justify-between mt-2 text-sm text-gray-600">
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
            </div>
        </div>
    )
}

