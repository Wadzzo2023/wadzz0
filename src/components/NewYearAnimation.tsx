import React from 'react';
import Lottie from 'lottie-react';
import happyNewYearAnimation from '../../public/happynewyear.json';

const NewYearAnimation: React.FC = () => {
    return (
        <div className="absolute top-0 right-0 transform  max-w-md z-10 pointer-events-none">
            <Lottie
                animationData={happyNewYearAnimation}
                loop={true}
                autoplay={true}
                className='h-52'
            />
        </div>
    );
};

export default NewYearAnimation;
