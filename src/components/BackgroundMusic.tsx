'use client'

import { Play, Pause, Music } from 'lucide-react'
import { Button } from '~/components/shadcn/ui/button'
import { useBackgroundMusic } from './context/BackgroundMusicContext'

export default function MusicControls() {
    const { isPlaying, togglePlay } = useBackgroundMusic()

    return (
        <div className="flex space-x-2">
            <Button onClick={togglePlay} variant="outline" size="icon">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Music className="h-4 w-4" />}
            </Button>
        </div>
    )
}
