'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react'
import { Button } from "~/components/shadcn/ui/button"

export function useBackgroundMusic() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        audioRef.current = new Audio('/christmas.mp3')
        audioRef.current.loop = true
        audioRef.current.volume = 0.05
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [])

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !audioRef.current.muted
            setIsMuted(!isMuted)
        }
    }

    return { isPlaying, isMuted, togglePlay, toggleMute }
}

export default function MusicControls() {
    const { isPlaying, isMuted, togglePlay, toggleMute } = useBackgroundMusic()

    return (
        <div className="flex space-x-2">
            <Button onClick={togglePlay} variant="outline" size="icon" className="">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Music className="h-4 w-4" />}
            </Button>

        </div>
    )
}
