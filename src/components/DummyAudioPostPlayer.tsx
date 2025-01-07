'use client'

import { useState, useRef, useEffect } from "react"
import { SkipBack, Play, Pause, SkipForward, Volume2 } from 'lucide-react'
import { Card, CardContent } from "~/components/shadcn/ui/card"
import { Button } from "~/components/shadcn/ui/button"
import { Slider } from "~/components/shadcn/ui/slider"
import { addrShort } from "package/connect_wallet/src/lib/utils"
import { useMedia } from "./hooks/useMedia"
import { usePlayer } from "./context/PlayerContext"
import { MediaType } from "@prisma/client"

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function DummyAudioPostPlayer({ audioId, name, artist, mediaUrl, creatorProfileUrl }: { audioId: number, name: string, artist: string, mediaUrl: string, creatorProfileUrl: string | null }) {
    const {
        isPlayerOpen,
        currentTrack,
        isPlaying,
        volume,
        isPIP,
        currentTime,
        duration,
        setCurrentTrack,
        setCurrentAudioPlayingId,
        setIsPlaying,
        setVolume,
        setIsPIP,
        setCurrentTime,
        currentAudioPlayingId,
        skipForward,
        skipBackward
    } = usePlayer()




    if (audioId !== currentAudioPlayingId) {
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
                        <h2 className="text-2xl font-bold mb-1 text-center font-serif">{name}</h2>
                        <p className="text-gray-400">{addrShort(artist, 7)}</p>
                    </div>

                    {/* Audio Controls */}
                    <div className="space-y-4">

                        {/* Progress Bar */}
                        <div className="space-y-2">

                            <Slider
                                step={1}

                                className="w-full"
                            />

                            <div className="flex justify-between text-sm text-gray-400">

                            </div>
                        </div>

                        {/* Playback Controls */}
                        <div className="flex items-center justify-center space-x-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className=""

                            >
                                <SkipBack className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-12 w-12 "
                                onClick={() => {
                                    setCurrentAudioPlayingId(audioId)
                                    setCurrentTrack({
                                        albumId: 1,
                                        artist: addrShort(artist, 7),
                                        asset: {
                                            creatorId: addrShort(artist, 7),
                                            description: name,
                                            issuer: 'issuer',
                                            limit: 0,
                                            mediaType: MediaType.MUSIC,
                                            privacy: 'PUBLIC',
                                            tierId: 1,
                                            code: 'video1',
                                            id: 1,
                                            mediaUrl: mediaUrl,
                                            name: name,
                                            thumbnail: creatorProfileUrl ?? 'https://app.wadzzo.com/images/loading.png',
                                        },
                                        assetId: 1,
                                        createdAt: new Date(),
                                        id: 1,
                                        price: 0,
                                        priceUSD: 0,
                                        creatorId: addrShort(artist, 7),

                                    })
                                    setIsPlaying(true)


                                }}

                            >

                                <Play className="h-6 w-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className=""

                            >
                                <SkipForward className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Volume Control */}
                        <div className="flex items-center space-x-2">

                            <Volume2 className="h-5 w-5 text-gray-400" />
                            <Slider

                                max={1}
                                step={0.01}

                                className="w-24"
                            />

                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }
}