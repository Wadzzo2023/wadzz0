'use client'

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Play, Pause, Volume2, Maximize2, SkipBack, SkipForward } from 'lucide-react'
import { Card, CardContent } from "~/components/shadcn/ui/card"
import { Button } from "~/components/shadcn/ui/button"
import { Slider } from "~/components/shadcn/ui/slider"
import { addrShort } from "package/connect_wallet/src/lib/utils"

interface VideoPlayerCardProps {
    title: string
    creatorId: string
    videoSrc: string
    thumbnailSrc?: string
}

export default function VideoPlayerCard({
    title,
    creatorId,
    videoSrc,
    thumbnailSrc = "/placeholder.svg?height=400&width=600"
}: VideoPlayerCardProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const setVideoData = () => {
            setDuration(video.duration)
            setCurrentTime(video.currentTime)
        }

        const setVideoTime = () => setCurrentTime(video.currentTime)

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        video.addEventListener('loadeddata', setVideoData)
        video.addEventListener('timeupdate', setVideoTime)
        video.addEventListener('ended', () => setIsPlaying(false))
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            video.removeEventListener('loadeddata', setVideoData)
            video.removeEventListener('timeupdate', setVideoTime)
            video.removeEventListener('ended', () => setIsPlaying(false))
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        }
    }, [])

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const handleTimeChange = (value: number[]) => {
        if (videoRef.current && value[0] !== undefined) {
            videoRef.current.currentTime = value[0]
            setCurrentTime(value[0])
        }
    }

    const handleVolumeChange = (value: number[]) => {
        const newVolume = value[0]
        if (newVolume !== undefined) {

            setVolume(newVolume)
            if (videoRef.current) {
                videoRef.current.volume = newVolume
            }
        }
    }

    const toggleFullscreen = () => {
        if (!containerRef.current) return

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const skipForward = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.min(videoRef.current.duration, currentTime + 10)
        }
    }

    const skipBackward = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, currentTime - 10)
        }
    }

    return (
        <Card className="w-full   text-black">
            <CardContent className="p-6 ">
                {/* Title Section */}


                {/* Video Container */}
                <div
                    ref={containerRef}
                    className={`relative group w-full ${isFullscreen ? 'h-screen' : 'max-h-[400px] md:max-h-[500px]'}`}
                    onMouseEnter={() => setShowControls(true)}
                    onMouseLeave={() => setShowControls(false)}
                >
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        className="w-full h-full object-contain bg-black rounded-lg"
                        onClick={togglePlayPause}
                        poster={thumbnailSrc}
                    />

                    {/* Video Controls Overlay */}
                    <div className={`absolute bottom-0  left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                        {/* Progress Bar */}
                        <div className="mb-4 px-2">
                            <h2 className="text-2xl  font-bold mb-1 font-serif text-white">{title}</h2>
                            <p className="text-gray-400">{addrShort(creatorId, 7)}</p>
                        </div>
                        <div className="space-y-2 ">
                            <Slider
                                value={[currentTime]}
                                max={duration}
                                step={1}
                                onValueChange={handleTimeChange}
                                className="[&>span:first-child]:bg-white [&>span:first-child>span]:bg-yellow-500 [&_[role=slider]]:bg-yellow-500 w-full"
                            />
                            <div className="flex justify-between text-sm text-gray-300">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:text-white hover:bg-white/10"
                                    onClick={skipBackward}
                                >
                                    <SkipBack className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 text-white hover:text-white hover:bg-white/10"
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
                                    className="text-white hover:text-white hover:bg-white/10"
                                    onClick={skipForward}
                                >
                                    <SkipForward className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="flex items-center space-x-4 ">
                                <div className="flex items-center space-x-2  rounded-md" >
                                    <Volume2 className="h-5 w-5 text-gray-400" />
                                    <Slider
                                        value={[volume]}
                                        max={1}
                                        step={0.01}
                                        onValueChange={handleVolumeChange}
                                        className="w-24  [&>span:first-child]:bg-white [&>span:first-child>span]:bg-yellow-500 [&_[role=slider]]:bg-yellow-500"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:text-white hover:bg-white/10"
                                    onClick={toggleFullscreen}
                                >
                                    <Maximize2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

