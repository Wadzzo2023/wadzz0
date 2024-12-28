import React, { useRef, useEffect, useState } from 'react';
import { Button } from '~/components/shadcn/ui/button';
import { Slider } from '~/components/shadcn/ui/slider';
import { Card, CardContent } from '~/components/shadcn/ui/card';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, PictureInPicture, X } from 'lucide-react';

import { usePostVideoMedia } from './context/PostVideoContext';
import { useIntersectionObserver } from './hooks/useIntersectionObserver';
import { addrShort } from '~/utils/utils';
import { usePlayer } from './context/PlayerContext';

function DummmyVideoPostPlayer({ videoId, name, artist, mediaUrl }: { videoId: number, name: string, artist: string, mediaUrl: string }) {
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
        isMinimized,
        setMediaRef,
        setIsMinimized,
        setCurrentVideo,
        currentVideoPlayingId,
        setVideoCurrentPlayingId,
    } = usePostVideoMedia();
    const [isVideoVisible, setIsVideoVisible] = useState(true)
    const { setCurrentTrack, currentAudioPlayingId, setCurrentAudioPlayingId } = usePlayer()

    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    if (videoId !== currentVideoPlayingId)
        return (
            <div className="relative w-full h-full"
                onClick={() => {
                    setCurrentTrack(null)
                    setCurrentAudioPlayingId(null)
                    if (!isPlaying && currentVideoPlayingId !== videoId) {
                        setCurrentVideo({ id: videoId, title: name, creatorId: artist, src: mediaUrl })
                        setVideoCurrentPlayingId(videoId)
                    }
                }}
            >
                <Card className="w-full text-black">
                    <CardContent className="p-6">
                        <div
                            ref={containerRef}
                            className={`relative group w-full`}
                            onMouseEnter={() => setShowControls(true)}
                            onMouseLeave={() => setShowControls(false)}
                        >
                            <div className="max-h-[400px] min-h-[400px] w-full md:max-h-[500px] md:min-h-[500px] rounded-lg bg-black">
                                <video
                                    ref={videoRef}
                                    className={` w-full  object-contain  max-h-[400px] min-h-[400px] md:max-h-[500px]`}

                                />

                            </div>

                            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="mb-4 px-2">
                                    <h2 className="text-2xl font-bold mb-1 font-serif text-white">{name}</h2>
                                    <p className="text-gray-400">{addrShort(artist, 7)}</p>
                                </div>
                                <div className="space-y-2">
                                    <Slider


                                        step={1}

                                        className="[&>span:first-child]:bg-white [&>span:first-child>span]:bg-yellow-500 [&_[role=slider]]:bg-yellow-500 w-full"
                                    />

                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-white hover:text-white hover:bg-white/10"

                                        >
                                            <SkipBack className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-12 w-12 text-white hover:text-white hover:bg-white/10"

                                        >

                                            <Play className="h-6 w-6" />

                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-white hover:text-white hover:bg-white/10"

                                        >
                                            <SkipForward className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2 rounded-md">
                                            <Volume2 className="h-5 w-5 text-gray-400" />
                                            <Slider

                                                max={1}
                                                step={0.01}

                                                className="w-24 [&>span:first-child]:bg-white [&>span:first-child>span]:bg-yellow-500 [&_[role=slider]]:bg-yellow-500"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-white hover:text-white hover:bg-white/10"

                                        >
                                            <Maximize2 className="h-5 w-5" />
                                        </Button>
                                        {/* <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-white hover:text-white hover:bg-white/10"

                                        >
                                            <PictureInPicture />
                                        </Button> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>

                </Card>



            </div >
        );
};

export default DummmyVideoPostPlayer;

