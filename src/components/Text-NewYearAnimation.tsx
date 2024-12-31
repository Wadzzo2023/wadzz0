import React from 'react';
import Lottie from 'lottie-react';
import happyNewYearAnimation from '../../public/text-happynewyear.json';

const TextNewYearAnimation: React.FC = () => {
    return (
        <div className="absolute top-0 right-0 transform  max-w-md z-10 pointer-events-none">
            <Lottie
                animationData={happyNewYearAnimation}
                loop={true}
                autoplay={true}
                className='h-36'
            />
        </div>
    );
};

export default TextNewYearAnimation;
