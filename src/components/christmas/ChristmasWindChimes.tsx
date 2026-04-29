import React from 'react';
import Lottie from 'lottie-react';
import ChristmasSleigh from "../../../public/ChristmasSleigh.json"
import ChristmasWindChimes from "../../../public/ChristmasWindChimes.json"

const ChristmasWindChimeAnimation: React.FC = () => {
    return (
        <div className="absolute top-0 right-0 transform  max-w-md z-10 pointer-events-none">
            <Lottie
                animationData={ChristmasWindChimes}
                loop={true}
                autoplay={true}
                className='h-52'
            />
        </div>
    );
};
export default ChristmasWindChimeAnimation;