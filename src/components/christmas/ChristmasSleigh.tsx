import React from 'react';
import Lottie from 'lottie-react';
import ChristmasSleigh from "../../../public/ChristmasSleigh.json"

const ChristmasSleighAnimation: React.FC = () => {
    return (
        <div className="absolute -top-4  left-0 right-0 z-50 h-32 w-full transition-all overflow-hidden duration-500 ease-out pointer-events-none">
            <Lottie
                animationData={ChristmasSleigh}
                loop={true}
                autoplay={true}
                className='h-52'
            />
        </div>
    );
};
export default ChristmasSleighAnimation;