import React, { useEffect, useState } from 'react'

interface Snowflake {
    id: number;
    left: number;
    top: number;
    size: number;
    speedY: number;
    speedX: number;
}

const SnowEffect: React.FC = () => {
    const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])

    useEffect(() => {
        const createSnowflake = (): Snowflake => ({
            id: Math.random(),
            left: Math.random() * 100,
            top: Math.random() * 100,
            size: Math.random() * 5 + 2,
            speedY: Math.random() * 1 + 0.5,
            speedX: Math.random() * 2 - 1,
        })

        const initialSnowflakes = Array.from({ length: 100 }, createSnowflake)
        setSnowflakes(initialSnowflakes)

        const intervalId = setInterval(() => {
            setSnowflakes((prevSnowflakes) =>
                prevSnowflakes.map((flake) => ({
                    ...flake,
                    left: (flake.left + flake.speedX + 100) % 100,
                    top: (flake.top + flake.speedY) % 100,
                    speedY: flake.top > 100 ? Math.random() * 1 + 0.5 : flake.speedY,
                }))
            )
        }, 50)

        return () => clearInterval(intervalId)
    }, [])

    return (
        <div className="snow-container">
            {snowflakes.map((flake) => (
                <div
                    key={flake.id}
                    className="snowflake"
                    style={{
                        left: `${flake.left}%`,
                        top: `${flake.top}%`,
                        width: `${flake.size}px`,
                        height: `${flake.size}px`,
                    }}
                />
            ))}
            <style jsx>{`
        .snow-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1000;
        }
        .snowflake {
          position: absolute;
          background-color: white;
          border-radius: 50%;
          opacity: 0.8;
          pointer-events: none;
        }
      `}</style>
        </div>
    )
}

export default SnowEffect

