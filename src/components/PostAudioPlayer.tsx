'use client'

import { useState, useRef, useEffect } from "react"
import { SkipBack, Play, Pause, SkipForward, Volume2 } from 'lucide-react'
import { Card, CardContent } from "~/components/shadcn/ui/card"
import { Button } from "~/components/shadcn/ui/button"
import { Slider } from "~/components/shadcn/ui/slider"
import { addrShort } from "package/connect_wallet/src/lib/utils"

interface AudioPlayerCardProps {
    title: string
    creatorId: string
    audioSrc: string
}

export default function AudioPlayerCard({ title, creatorId, audioSrc }: AudioPlayerCardProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const setAudioData = () => {
            setDuration(audio.duration)
            setCurrentTime(audio.currentTime)
        }

        const setAudioTime = () => setCurrentTime(audio.currentTime)
        audio.addEventListener('loadeddata', setAudioData)
        audio.addEventListener('timeupdate', setAudioTime)

        return () => {
            audio.removeEventListener('loadeddata', setAudioData)
            audio.removeEventListener('timeupdate', setAudioTime)
        }
    }, [])

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }
    const handleTimeChange = (value: number[]) => {
        if (audioRef.current && value[0] !== undefined) {
            audioRef.current.currentTime = value[0];
            setCurrentTime(value[0]);
        }
    };

    const handleVolumeChange = (value: number[]) => {
        const newVolume = value[0];
        if (newVolume !== undefined) {
            setVolume(newVolume);
            if (audioRef.current) {
                audioRef.current.volume = newVolume;
            }
        }
    };
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    const skipForward = () => {
        const audio = audioRef.current
        if (!audio) return

        audio.currentTime = Math.min(audio.duration, audio.currentTime + 10)
    }
    const skipBackward = () => {
        const audio = audioRef.current
        if (!audio) return

        audio.currentTime = Math.min(audio.duration, audio.currentTime - 10)
    }
    return (
        <Card className="w-full max-w-md  text-black">
            <CardContent className="p-6">
                {/* Album Art and Title Section */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-32 h-32 bg-[#1a1a2e] rounded-lg mb-4 flex items-center justify-center">
                        <svg
                            className="w-16 h-16 text-white"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-1 text-center font-serif">{title}</h2>
                    <p className="text-gray-400">{addrShort(creatorId, 7)}</p>
                </div>

                {/* Audio Controls */}
                <div className="space-y-4">
                    <audio ref={audioRef} src={audioSrc} />

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <Slider
                            value={[currentTime]}
                            max={duration}
                            step={1}
                            onValueChange={handleTimeChange}
                            className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Playback Controls */}
                    <div className="flex items-center justify-center space-x-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className=""
                            onClick={skipBackward}
                        >
                            <SkipBack className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-12 w-12 "
                            onClick={togglePlayPause}
                        >
                            {isPlaying ? (
                                <Pause className="h-6 w-6" />
                            ) : (
                                <Play className="h-6 w-6" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className=""
                            onClick={skipForward}
                        >
                            <SkipForward className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center space-x-2">
                        <Volume2 className="h-5 w-5 text-gray-400" />
                        <Slider
                            value={[volume]}
                            max={1}
                            step={0.01}
                            onValueChange={handleVolumeChange}
                            className="w-24"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

