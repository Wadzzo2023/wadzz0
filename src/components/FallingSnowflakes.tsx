'use client'

import React, { useState, useEffect } from 'react'
import Snowflake from './Snowflake'
import { useBackgroundMusic } from './context/BackgroundMusicContext'

interface SnowflakeData {
    id: number
    size: number
    left: string
    animationDuration: string
}

export default function FallingSnowflakes() {
    const [snowflakes, setSnowflakes] = useState<SnowflakeData[]>([])
    const { isPlaying } = useBackgroundMusic()
    console.log("isPlaying in FallingSnowflakes", isPlaying)
    useEffect(() => {
        if (!isPlaying) {
            setSnowflakes([])
            return
        }

        const generateSnowflakes = () => {
            const newSnowflakes: SnowflakeData[] = []
            for (let i = 0; i < 14; i++) {
                newSnowflakes.push({
                    id: i,
                    size: Math.random() * 30 + 20,
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 10 + 20}s`,
                })
            }
            setSnowflakes(newSnowflakes)
        }

        generateSnowflakes()
    }, [isPlaying])

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {snowflakes.map((flake) => (
                <Snowflake
                    key={flake.id}
                    size={flake.size}
                    className="absolute animate-fall"
                    style={{
                        left: flake.left,
                        animationDuration: flake.animationDuration,
                    }}
                />
            ))}
        </div>
    )
}
