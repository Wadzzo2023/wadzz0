import { useState, useEffect } from 'react';

const useCountdown = (initialSeconds: number) => {
    const [seconds, setSeconds] = useState<number | null>(null);

    const startCountdown = () => {
        setSeconds(initialSeconds); // Initialize the countdown
    };

    useEffect(() => {
        if (seconds === null || seconds === 0) return;

        const intervalId = setInterval(() => {
            setSeconds((prev) => (prev !== null ? prev - 1 : prev));
        }, 1000);

        // Clear the interval when the countdown ends or component unmounts
        return () => clearInterval(intervalId);
    }, [seconds]);

    return { seconds, startCountdown };
};

export default useCountdown;
