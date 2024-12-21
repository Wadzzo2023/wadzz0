import React from 'react';
import Image from 'next/image';

const Santa: React.FC = () => {
    return (
        <div className="santa-container absolute bottom-0 left-0 w-full overflow-hidden">
            <div className="santa-walk">
                <Image
                    src="/santa-walking.gif" // Make sure to add this GIF to your public folder
                    alt="Walking Santa"
                    width={100}
                    height={100}
                />
            </div>
            <style jsx>{`
        .santa-container {
          height: 100px;
        }
        .santa-walk {
          animation: walkAnimation 20s linear infinite;
        }
        @keyframes walkAnimation {
          0% {
            transform: translateX(-100px);
          }
          100% {
            transform: translateX(calc(100vw + 100px));
          }
        }
      `}</style>
        </div>
    );
};

export default Santa;

