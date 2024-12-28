import React, { createContext, useState, useRef, useCallback, useContext, useEffect } from 'react';

interface Video {
    id: number
    title: string;
    creatorId: string;
    src: string;
}

interface PostVideoContextType {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    showControls: boolean;
    isFullscreen: boolean;
    currentVideo: Video | null;
    currentVideoPlayingId: number | null;
    isMinimized: boolean;
    isPictureInPicture: boolean;
    mediaRef: React.MutableRefObject<HTMLVideoElement | null>;
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    seek: (time: number) => void;
    skipForward: (seconds: number) => void;
    skipBackward: (seconds: number) => void;
    setVolume: (volume: number) => void;
    setShowControls: (show: boolean) => void;
    setIsMinimized: (minimized: boolean) => void;
    setMediaRef: (ref: HTMLVideoElement | null) => void;
    setCurrentVideo: (video: Video | null) => void;
    setVideoCurrentPlayingId: (id: number | null) => void;
    togglePictureInPicture: () => void;
}

const PostVideoContext = createContext<PostVideoContextType | undefined>(undefined);

export const PostVideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const mediaRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [currentVideoPlayingId, setVideoCurrentPlayingId] = useState<number | null>(null);
    const [isMinimized, setIsMinimizedState] = useState(false);
    const [isPictureInPicture, setIsPictureInPicture] = useState(false);

    useEffect(() => {
        if (currentVideo) {
            setCurrentVideo(currentVideo);
            setIsPlaying(true);
        }
    }, [currentVideo]);

    const setIsMinimized = useCallback((minimized: boolean) => {
        setIsMinimizedState(minimized);
        // Don't change the play state when minimizing/maximizing
    }, []);

    useEffect(() => {
        if (mediaRef.current) {
            if (isPlaying) {
                mediaRef.current.play();
            } else {
                mediaRef.current.pause();
            }
        }
    }, [isPlaying]);

    const play = useCallback(() => {
        if (mediaRef.current) {
            mediaRef.current.play();
            setIsPlaying(true);
        }
    }, [currentVideo]);

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

    const setMediaRef = useCallback((ref: HTMLVideoElement | null) => {
        mediaRef.current = ref;
        if (ref) {
            ref.addEventListener('timeupdate', () => setCurrentTime(ref.currentTime));
            ref.addEventListener('durationchange', () => setDuration(ref.duration));
            ref.addEventListener('ended', () => setIsPlaying(false));
        }
    }, []);

    const togglePictureInPicture = useCallback(async () => {
        if (!mediaRef.current) return;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await mediaRef.current.requestPictureInPicture();
            }
        } catch (error) {
            console.error('Failed to toggle Picture-in-Picture mode:', error);
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        const handlePictureInPictureChange = () => {
            setIsPictureInPicture(!!document.pictureInPictureElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('enterpictureinpicture', handlePictureInPictureChange);
        document.addEventListener('leavepictureinpicture', handlePictureInPictureChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('enterpictureinpicture', handlePictureInPictureChange);
            document.removeEventListener('leavepictureinpicture', handlePictureInPictureChange);
        };
    }, []);

    const value = {
        isPlaying,
        currentTime,
        duration,
        volume,
        showControls,
        isFullscreen,
        currentVideo,
        currentVideoPlayingId,
        mediaRef,
        isMinimized,
        isPictureInPicture,
        play,
        pause,
        togglePlay,
        seek,
        skipForward,
        skipBackward,
        setVolume: setVolumeValue,
        setShowControls,
        setIsMinimized,
        setMediaRef,
        setCurrentVideo,
        setVideoCurrentPlayingId,
        togglePictureInPicture,
    };

    return <PostVideoContext.Provider value={value}>{children}</PostVideoContext.Provider>;
};

export const usePostVideoMedia = (): PostVideoContextType => {
    const context = useContext(PostVideoContext);
    if (context === undefined) {
        throw new Error('usePostVideoMedia must be used within a PostVideoProvider');
    }
    return context;
};

