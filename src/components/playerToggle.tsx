import React from 'react'
import { Button } from './shadcn/ui/button'
import { Music } from 'lucide-react'
import { usePlayer } from './context/PlayerContext'

export const PlayerToggle: React.FC = () => {
    const { isPlayerOpen, setIsPlayerOpen, currentTrack } = usePlayer()

    if (isPlayerOpen || !currentTrack) return null

    return (
        <div className="fixed right-0 bottom-16 lg:bottom-4 lg:right-80 ">
            <Button
                variant="secondary"
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg"
                onClick={() => setIsPlayerOpen(true)}
            >
                <Music className="h-6 w-6" />
            </Button>
        </div>
    )
}

