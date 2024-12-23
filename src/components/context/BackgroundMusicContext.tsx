'use client'

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react'

interface BackgroundMusicContextProps {
    isPlaying: boolean
    togglePlay: () => void
}

const BackgroundMusicContext = createContext<BackgroundMusicContextProps | undefined>(undefined)

export function BackgroundMusicProvider({ children }: { children: ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false)
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

    return (
        <BackgroundMusicContext.Provider value={{ isPlaying, togglePlay }}>
            {children}
        </BackgroundMusicContext.Provider>
    )
}

export function useBackgroundMusic() {
    const context = useContext(BackgroundMusicContext)
    if (!context) {
        throw new Error('useBackgroundMusic must be used within a BackgroundMusicProvider')
    }
    return context
}
