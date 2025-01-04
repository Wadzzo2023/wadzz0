import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '~/components/shadcn/ui/button';
import { Slider } from '~/components/shadcn/ui/slider';
import { Card, CardContent } from '~/components/shadcn/ui/card';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, PictureInPicture, X } from 'lucide-react';

import { usePostVideoMedia } from './context/PostVideoContext';
import { useIntersectionObserver } from './hooks/useIntersectionObserver';

export const PostVideoPlayer: React.FC<{ videoId?: number }> = ({ videoId }) => {
    const {
        isPlaying,
        currentTime,
        duration,
        volume,
        showControls,
        currentVideo,
        play,
        pause,
        togglePlay,
        seek,
        skipForward,
        skipBackward,
        setVolume,
        setShowControls,
        setCurrentVideo,
        isMinimized,
        setMediaRef,
        setIsMinimized,
        currentVideoPlayingId,
        togglePictureInPicture,
    } = usePostVideoMedia();
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isPiPActive, setIsPiPActive] = useState(false)
    const [isVideoVisible, setIsVideoVisible] = useState(true)
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);



    useEffect(() => {
        if (videoRef.current) {
            setMediaRef(videoRef.current);
        }
    }, [setMediaRef]);




    useEffect(() => {
        if (videoRef.current && currentVideo && videoRef.current.src !== currentVideo.src) {
            videoRef.current.src = currentVideo.src;
        }
    }, [currentVideo]);



    useEffect(() => {
        if (videoRef.current) {
            if (isPlaying && currentVideoPlayingId === videoId) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }
    }, [isPlaying, currentVideoPlayingId, videoId]);



    const handleTimeChange = (value: number[]) => {
        if (value[0] !== undefined) {
            seek(value[0]);
        }
    };

    const handleVolumeChange = (value: number[]) => {
        if (value[0] !== undefined) {
            setVolume(value[0]);
        }
    };
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
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const addrShort = (address: string, chars: number) => {
        return `${address.slice(0, chars)}...${address.slice(-chars)}`;
    };





    if (!currentVideo) {
        return null;
    }
    return (
        <div className="relative w-full ">

            <Card className="w-full text-black">
                <CardContent className="p-6">
                    <div
                        ref={containerRef}
                        className={`relative group w-full ${isFullscreen ? 'h-screen' : ''}`}
                        onMouseEnter={() => setShowControls(true)}
                        onMouseLeave={() => setShowControls(false)}
                    >
                        <div className="max-h-[400px] min-h-[400px] w-full md:max-h-[500px] md:min-h-[500px] rounded-lg bg-black">


                            <video
                                ref={videoRef}
                                className={` w-full  object-contain ${isFullscreen ? 'h-screen' : 'max-h-[400px] min-h-[400px]  md:max-h-[500px] md:min-h-[500px] '}`}
                                onClick={togglePlay}
                            />

                        </div>

                        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="mb-4 px-2">
                                <h2 className="text-2xl font-bold mb-1 font-serif text-white">{currentVideo.title}</h2>
                                <p className="text-gray-400">{addrShort(currentVideo.creatorId, 7)}</p>
                            </div>
                            <div className="space-y-2">
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

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-white hover:text-white hover:bg-white/10"
                                        onClick={() => skipBackward(10)}
                                    >
                                        <SkipBack className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-12 w-12 text-white hover:text-white hover:bg-white/10"
                                        onClick={togglePlay}
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
                                        onClick={() => skipForward(10)}
                                    >
                                        <SkipForward className="h-5 w-5" />
                                    </Button>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2 rounded-md">
                                        <Volume2 className="h-5 w-5 text-gray-400" />
                                        <Slider
                                            value={[volume]}
                                            max={1}
                                            step={0.01}
                                            onValueChange={handleVolumeChange}
                                            className="w-24 [&>span:first-child]:bg-white [&>span:first-child>span]:bg-yellow-500 [&_[role=slider]]:bg-yellow-500"
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
                                    {/* <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-white hover:text-white hover:bg-white/10"
                                        onClick={togglePictureInPicture}
                                    >
                                        <PictureInPicture />
                                    </Button> */}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
                {isPiPActive && (
                    <div className="fixed bottom-4 left-4 bg-black text-white px-4 py-2 rounded-md shadow-lg z-50">
                        Video is playing in picture-in-picture mode
                    </div>
                )}
            </Card>



        </div >
    );
};

export default PostVideoPlayer;

