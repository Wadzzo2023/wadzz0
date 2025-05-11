import React, { createContext, useContext, useState, useEffect } from 'react'
import { SongItemType } from '~/lib/state/play/use-modal-store'



type PlayerContextType = {
    currentTrack: SongItemType | null
    currentAudioPlayingId: number | null
    isPlaying: boolean
    volume: number
    isPIP: boolean
    playlist: SongItemType[]
    currentTime: number
    duration: number
    isPlayerOpen: boolean;
    setPlaylist: (playlist: SongItemType[]) => void
    setCurrentTrack: (track: SongItemType | null) => void
    setIsPlaying: (isPlaying: boolean) => void
    setVolume: (volume: number) => void
    setIsPIP: (isPIP: boolean) => void
    setCurrentTime: (time: number) => void
    setDuration: (duration: number) => void
    nextTrack: () => void
    previousTrack: () => void
    skipForward: () => void
    skipBackward: () => void
    setCurrentAudioPlayingId: (id: number | null) => void
    setIsPlayerOpen: (isOpen: boolean) => void;
}
const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export const usePlayer = () => {
    const context = useContext(PlayerContext)
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider')
    }
    return context
}

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState<SongItemType | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [volume, setVolume] = useState(1)
    const [isPIP, setIsPIP] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isPlayerOpen, setIsPlayerOpen] = useState(true);
    const [currentAudioPlayingId, setCurrentAudioPlayingId] = useState<number | null>(null)
    const [playlist, setPlaylist] = useState<SongItemType[]>([

        // {
        //     id: 1,
        //     artist: 'Artist 1',
        //     assetId: 1,
        //     price: 0,
        //     priceUSD: 0,
        //     albumId: 1,
        //     createdAt: new Date(),
        //     asset: {
        //         id: 1,
        //         name: 'Song 1',
        //         thumbnail: 'https://via.placeholder.com/150',
        //         mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        //         code: 'song1',
        //         creatorId: "1",
        //         description: 'This is a song',
        //         issuer: 'issuer',
        //         limit: 1,
        //         mediaType: MediaType.MUSIC,
        //         privacy: 'PUBLIC',
        //         tierId: 1,
        //     }
        // },
    ])

    useEffect(() => {
        if (currentTrack) {
            setCurrentTrack(currentTrack);
        }
    }, [currentTrack]);

    useEffect(() => {
        if (playlist.length > 0) {
            setCurrentTrack(playlist[0]!);
        }
    }, [currentTrack]);


    const nextTrack = () => {
        if (currentTrack && playlist.length > 0) {
            const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
            const nextIndex = (currentIndex + 1) % playlist.length;
            const nextTrack = playlist[nextIndex];
            if (nextTrack) {
                setCurrentTrack(nextTrack);
            }
        }
    };

    const previousTrack = () => {
        if (currentTrack && playlist.length > 0) {
            const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
            const previousIndex = (currentIndex - 1 + playlist.length) % playlist.length;
            const previousTrack = playlist[previousIndex];
            if (previousTrack) {
                setCurrentTrack(previousTrack);
            }
        }
    };

    const skipForward = () => {
        setCurrentTime(prevTime => Math.min(prevTime + 15, duration))
    }

    const skipBackward = () => {
        setCurrentTime(prevTime => Math.max(prevTime - 15, 0))
    }

    return (
        <PlayerContext.Provider
            value={{
                currentTrack,
                isPlaying,
                volume,
                isPIP,
                playlist,
                currentTime,
                duration,
                isPlayerOpen,
                currentAudioPlayingId,
                setCurrentTrack,
                setIsPlaying,
                setVolume,
                setIsPIP,
                setCurrentTime,
                setDuration,
                nextTrack,
                previousTrack,
                skipForward,
                skipBackward,
                setPlaylist,
                setIsPlayerOpen,
                setCurrentAudioPlayingId

            }
            }
        >
            {children}
        </PlayerContext.Provider>
    )
}

