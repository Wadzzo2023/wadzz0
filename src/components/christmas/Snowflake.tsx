'use client'

import React from 'react'

interface SnowflakeProps {
    size?: number
    color?: string
    strokeColor?: string
    strokeWidth?: number
    className?: string
    style?: React.CSSProperties
}

export default function Snowflake({
    size = 50,
    color = '#B8E3FF',
    strokeColor = '#16A349',
    strokeWidth = 1,
    className = '',
    style = {},
}: SnowflakeProps) {
    const branches = Array.from({ length: 6 }, (_, i) => i * 60)

    return (
        <svg
            width={size}
            height={size}
            viewBox="-100 -100 200 200"
            className={className}
            style={style}
        >
            {branches.map((rotation) => (
                <g
                    key={rotation}
                    transform={`rotate(${rotation})`}
                    fill={color}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                >
                    <path d="M 0 0 L 0 -70 L 0 0" />
                    <path d="M 0 -40 L -20 -60 L 0 -40" />
                    <path d="M 0 -40 L 20 -60 L 0 -40" />
                </g>
            ))}
        </svg>
    )
}