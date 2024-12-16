import React from 'react'
import { PictureInPicture, Play, Pause, Volume2, VolumeX, Rewind, FastForward } from 'lucide-react'

import { Button } from './shadcn/ui/button'
import { Slider } from './shadcn/ui/slider'
import Image from 'next/image'
import { usePlayer } from './context/PlayerContext'
import { useMedia } from './hooks/useMedia'

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
        skipForward,
        skipBackward
    } = usePlayer()

    const isVideo = currentTrack?.asset.mediaType === 'VIDEO'
    const { mediaRef, togglePlay, seek, changeVolume } = useMedia(isVideo ? 'video' : 'audio')

    const handleVolumeChange = (newVolume: number[]) => {
        const vol = newVolume[0]!
        setVolume(vol)
        changeVolume(vol)
    }

    const handleTimeChange = (newTime: number[]) => {
        const time = newTime[0]!
        setCurrentTime(time)
        seek(time)
    }


    if (!currentTrack || !isPlayerOpen) return null

    return (
        <div className="bg-white flex-col flex justify-center items-center shadow-md h-full w-full">
            {isVideo ? (
                <video
                    ref={mediaRef as React.RefObject<HTMLVideoElement>}
                    src={currentTrack.asset.mediaUrl}
                    className="w-64 h-64 rounded-lg mb-4 shadow-lg shadow-teal-50 object-cover"
                />
            ) : (
                <Image
                    src={currentTrack.asset.thumbnail}
                    alt={currentTrack.asset.name}
                    width={1000}
                    height={1000}
                    className="w-64 h-64 rounded-lg mb-4 shadow-lg shadow-teal-50 object-cover"
                />
            )}

            <h2 className="text-xl font-semibold text-center">{currentTrack.asset.name}</h2>
            <p className="text-gray-600 text-sm text-center">{currentTrack.artist}</p>

            <div className="mt-6 flex justify-center items-center">
                <Button variant="ghost" size="icon" className='' onClick={skipBackward}>
                    <Rewind className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={togglePlay} className=''>
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={skipForward} className=''>
                    <FastForward className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-2 w-24">
                    {volume > 0 ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                    <Slider
                        className="w-full"
                        value={[volume]}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                    />
                </div>

            </div>

            <div className="flex w-full justify-between mt-2 text-sm text-gray-600">
                <div className="flex items-center space-x-4 w-full p-2">
                    <span className="text-sm">{formatTime(currentTime)}</span>
                    <Slider
                        className="flex-grow w-full"
                        value={[currentTime]}
                        max={duration}
                        step={1}
                        onValueChange={handleTimeChange}
                    />
                    <span className="text-sm">{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    )
}

