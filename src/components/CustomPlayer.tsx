import React, { useState, useRef } from "react";
import ReactPlayer from "react-player/lazy";
import { Pause, Play } from "lucide-react";

interface CustomPlayerProps {
    url: string;
}

const CustomPlayer: React.FC<CustomPlayerProps> = ({ url }) => {
    const [playing, setPlaying] = useState(false);
    const playerRef = useRef<ReactPlayer>(null);

    const togglePlayPause = () => {
        setPlaying(!playing);
    };

    return (
        <div className="relative rounded-md overflow-hidden">
            <ReactPlayer
                ref={playerRef}
                url={url}
                playing={playing}
                controls={false}
                width="100%"
                height="100%"
                className="react-player"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <button
                    className="rounded-full bg-white bg-opacity-70 p-4 text-primary transition-colors hover:bg-opacity-90"
                    onClick={togglePlayPause}
                >
                    {playing ? <Pause size={32} /> : <Play size={32} />}
                </button>
            </div>
        </div>
    );
};

export default CustomPlayer;

