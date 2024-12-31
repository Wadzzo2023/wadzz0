import React, { createContext, useState, useRef, useCallback, useContext, useEffect } from 'react';
interface Audio {
    id: number
    title: string;
    creatorId: string;
    src: string;
}
interface PostAudioContextType {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    showControls: boolean;
    isFullscreen: boolean;
    currentAudio: Audio | null;
    currentAudioPlayingId: number | null;
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    seek: (time: number) => void;
    skipForward: (seconds: number) => void;
    skipBackward: (seconds: number) => void;
    setVolume: (volume: number) => void;
    setShowControls: (show: boolean) => void;
    setMediaRef: (ref: HTMLAudioElement | null) => void;
    setCurrentAudio: (audio: Audio) => void;

    setAudioCurrentPlayingId: (id: number | null) => void;

}

const PostAudioContext = createContext<PostAudioContextType | undefined>(undefined);

export const PostAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const mediaRef = useRef<HTMLAudioElement | null>(null);
    const [currentAudioPlayingId, setAudioCurrentPlayingId] = useState<number | null>(null);
    const [currentAudio, setCurrentAudio] = useState<Audio | null>(null);

    const play = useCallback(() => {
        if (mediaRef.current) {
            mediaRef.current.play();
            setIsPlaying(true);
        }
    }, []);

    const pause = useCallback(() => {
        if (mediaRef.current) {
            mediaRef.current.pause();
            setIsPlaying(false);
        }
    }, []);

    const togglePlay = useCallback(() => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    }, [isPlaying, pause, play]);

    const seek = useCallback((time: number) => {
        if (mediaRef.current) {
            mediaRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const skipForward = useCallback((seconds: number) => {
        if (mediaRef.current) {
            const newTime = Math.min(mediaRef.current.currentTime + seconds, duration);
            seek(newTime);
        }
    }, [duration, seek]);

    const skipBackward = useCallback((seconds: number) => {
        if (mediaRef.current) {
            const newTime = Math.max(mediaRef.current.currentTime - seconds, 0);
            seek(newTime);
        }
    }, [seek]);

    const setVolumeValue = useCallback((newVolume: number) => {
        if (mediaRef.current) {
            mediaRef.current.volume = newVolume;
            setVolume(newVolume);
        }
    }, []);



    const setMediaRef = useCallback((ref: HTMLVideoElement | HTMLAudioElement | null) => {
        mediaRef.current = ref;
        if (ref) {
            ref.addEventListener('timeupdate', () => setCurrentTime(ref.currentTime));
            ref.addEventListener('durationchange', () => setDuration(ref.duration));
            ref.addEventListener('ended', () => setIsPlaying(false));
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const value = {
        isPlaying,
        currentTime,
        duration,
        volume,
        showControls,
        isFullscreen,
        currentAudio,
        currentAudioPlayingId,
        play,
        pause,
        togglePlay,
        seek,
        skipForward,
        skipBackward,
        setVolume: setVolumeValue,
        setShowControls,
        setAudioCurrentPlayingId,
        setMediaRef,
        setCurrentAudio,
    };

    return <PostAudioContext.Provider value={value}>{children}</PostAudioContext.Provider>;
};

export const usePostAudioMedia = (): PostAudioContextType => {
    const context = useContext(PostAudioContext);
    if (context === undefined) {
        throw new Error('useMedia must be used within a MediaProvider');
    }
    return context;
};
