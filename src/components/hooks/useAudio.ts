import { useEffect, useRef } from 'react'
import { usePlayer } from '../context/PlayerContext'

export const useAudio = () => {
    const {
        duration,
        currentTrack,
        isPlaying,
        volume,
        currentTime,
        setIsPlaying,
        setCurrentTime,
        setDuration
    } = usePlayer()

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && !audioRef.current) {
            // Ensure the Audio object is created only on the client
            audioRef.current = new Audio();
        }
    }, []);
    useEffect(() => {
        if (currentTrack) {
            if (audioRef.current) {
                audioRef.current.src = currentTrack.asset.mediaUrl
                audioRef.current.load()
                if (isPlaying) {
                    audioRef.current.play()
                    audioRef.current.addEventListener('timeupdate', () => {
                        setCurrentTime(audioRef.current?.currentTime ?? 0)
                    })
                    audioRef.current.addEventListener('loadedmetadata', () => {
                        setDuration(audioRef.current?.duration ?? 0)
                    })
                }
            } else {
                audioRef.current = new Audio(currentTrack.asset.mediaUrl)
                audioRef.current.addEventListener('ended', () => setIsPlaying(false))
                audioRef.current.addEventListener('timeupdate', () => {
                    setCurrentTime(audioRef.current?.currentTime ?? 0)
                })
                audioRef.current.addEventListener('loadedmetadata', () => {
                    setDuration(audioRef.current?.duration ?? 0)
                })
            }
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.removeEventListener('ended', () => setIsPlaying(false))
                audioRef.current.removeEventListener('timeupdate', () => {
                    setCurrentTime(audioRef.current?.currentTime ?? 0)
                })
                audioRef.current.removeEventListener('loadedmetadata', () => {
                    setDuration(audioRef.current?.duration ?? 0)
                })
            }
        }
    }, [currentTrack, setIsPlaying, setCurrentTime, setDuration])

    useEffect(() => {

        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play()
            } else {
                audioRef.current.pause()
            }
        }
    }, [isPlaying])

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume
        }
    }, [volume])

    useEffect(() => {
        if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 1) {
            audioRef.current.currentTime = currentTime
        }
        if (duration && currentTime >= duration) {
            setIsPlaying(false)
        }
    }, [currentTime])

    return audioRef
}