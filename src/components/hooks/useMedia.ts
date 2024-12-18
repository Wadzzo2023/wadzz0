import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'

type MediaType = 'audio' | 'video'

export const useMedia = (mediaType: MediaType) => {
    const {
        currentTrack,
        isPlaying,
        volume,
        currentTime,
        setIsPlaying,
        setCurrentTime,
        setDuration
    } = usePlayer()

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)

    const [mediaElement, setMediaElement] = useState<HTMLAudioElement | HTMLVideoElement | null>(null)

    useEffect(() => {
        if (currentTrack) {
            let element: HTMLAudioElement | HTMLVideoElement

            if (mediaType === 'audio') {
                if (!audioRef.current) {
                    audioRef.current = new Audio()
                }
                element = audioRef.current
            } else {
                if (!videoRef.current) {
                    videoRef.current = document.createElement('video')
                }
                element = videoRef.current
            }

            element.src = currentTrack.asset.mediaUrl
            element.load()

            const handleTimeUpdate = () => setCurrentTime(element.currentTime)
            const handleLoadedMetadata = () => setDuration(element.duration)
            const handleEnded = () => setIsPlaying(false)

            element.addEventListener('timeupdate', handleTimeUpdate)
            element.addEventListener('loadedmetadata', handleLoadedMetadata)
            element.addEventListener('ended', handleEnded)

            setMediaElement(element)

            return () => {
                element.pause()
                element.removeEventListener('timeupdate', handleTimeUpdate)
                element.removeEventListener('loadedmetadata', handleLoadedMetadata)
                element.removeEventListener('ended', handleEnded)
            }
        }
    }, [currentTrack, mediaType, setCurrentTime, setDuration, setIsPlaying])

    useEffect(() => {
        if (mediaElement) {
            if (isPlaying) {
                mediaElement.play()
            } else {
                mediaElement.pause()
            }
        }
    }, [isPlaying, mediaElement])

    useEffect(() => {
        if (mediaElement) {
            mediaElement.volume = volume
        }
    }, [volume, mediaElement])

    useEffect(() => {
        if (mediaElement && Math.abs(mediaElement.currentTime - currentTime) > 1) {
            mediaElement.currentTime = currentTime
        }
    }, [currentTime, mediaElement])

    const togglePlay = () => {
        if (mediaElement) {
            if (isPlaying) {
                mediaElement.pause()
            } else {
                mediaElement.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const seek = (time: number) => {
        if (mediaElement) {
            mediaElement.currentTime = time
        }
    }

    const changeVolume = (newVolume: number) => {
        if (mediaElement) {
            mediaElement.volume = newVolume
        }
    }

    return {
        mediaRef: mediaType === 'audio' ? audioRef : videoRef,
        togglePlay,
        seek,
        changeVolume
    }
}

