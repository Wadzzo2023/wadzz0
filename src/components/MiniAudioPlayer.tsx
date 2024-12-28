// import React, { RefObject, useState } from 'react';
// import Draggable from 'react-draggable';
// import { Button } from '~/components/shadcn/ui/button';
// import { Slider } from '~/components/shadcn/ui/slider';
// import { Card, CardContent } from '~/components/shadcn/ui/card';
// import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, X, FastForward, ChevronFirst, ChevronLast } from 'lucide-react';
// import { usePostAudioMedia } from './context/PostAudioContext';

// interface MiniPlayerProps {
//     title: string;
//     onMaximize: () => void;
//     onClose: () => void;
//     audioRef: RefObject<HTMLAudioElement>;
// }

// const MiniAudioPlayer: React.FC<MiniPlayerProps> = ({ title, onMaximize, onClose, audioRef }) => {
//     const {
//         isPlaying,
//         currentTime,
//         duration,
//         volume,
//         togglePlay,
//         seek,
//         skipForward,
//         skipBackward,
//         setVolume,
//         pause,
//     } = usePostAudioMedia();

//     const [position, setPosition] = useState({ x: 0, y: 0 });

//     const handleTimeChange = (value: number[]) => {
//         if (value[0] !== undefined) {
//             seek(value[0]);
//         }
//     };

//     const handleVolumeChange = (value: number[]) => {
//         if (value[0] !== undefined) {
//             setVolume(value[0]);
//         }
//     };

//     const formatTime = (time: number) => {
//         const minutes = Math.floor(time / 60);
//         const seconds = Math.floor(time % 60);
//         return `${minutes}:${seconds.toString().padStart(2, '0')}`;
//     };

//     const handleDrag = (e: any, data: { x: number; y: number }) => {
//         setPosition({ x: data.x, y: data.y });
//     };

//     const handleClose = () => {
//         pause();
//         onClose();
//     };

//     return (
//         <Draggable
//             position={position}
//             onDrag={handleDrag}

//             handle=".drag-handle"
//         >
//             <Card className="fixed bottom-4 right-4 w-80 bg-background shadow-lg rounded-lg overflow-hidden z-50">
//                 <CardContent className="p-4">
//                     <div className="flex items-center justify-between mb-2 drag-handle cursor-move">
//                         <h3 className="text-sm font-medium truncate">{title}</h3>
//                         <div>
//                             <Button variant="ghost" size="icon" onClick={handleClose}>
//                                 <X className="h-4 w-4" />
//                             </Button>
//                         </div>
//                     </div>
//                     <Slider
//                         value={[currentTime]}
//                         max={duration}
//                         step={1}
//                         onValueChange={handleTimeChange}
//                         className="mb-2"
//                     />
//                     <div className="flex justify-between text-xs mb-2">
//                         <span>{formatTime(currentTime)}</span>
//                         <span>{formatTime(duration)}</span>
//                     </div>
//                     <div className="flex items-center justify-between">
//                         <Button variant="ghost" size="icon" onClick={() => skipBackward(10)}>
//                             <ChevronFirst className="h-4 w-4" />
//                         </Button>
//                         <Button variant="ghost" size="icon" onClick={togglePlay}>
//                             {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
//                         </Button>
//                         <Button variant="ghost" size="icon" onClick={() => skipForward(10)}>
//                             <ChevronLast className="h-4 w-4" />
//                         </Button>
//                         <div className="flex items-center">
//                             <Volume2 className="h-4 w-4 mr-2" />
//                             <Slider
//                                 value={[volume]}
//                                 max={1}
//                                 step={0.01}
//                                 onValueChange={handleVolumeChange}
//                                 className="w-20"
//                             />
//                         </div>
//                     </div>
//                 </CardContent>
//             </Card>
//         </Draggable>
//     );
// };

// export default MiniAudioPlayer;

