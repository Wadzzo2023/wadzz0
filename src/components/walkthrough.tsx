'use client'

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "~/components/shadcn/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/shadcn/ui/card"
import { useWalkThrough } from "./hooks/play/useWalkthrough"

type StepProps = {
    target?: {
        x: number
        y: number
        width: number
        height: number
    }
    title: string
    content: string
    isVisible?: boolean
    currentStep?: number
    totalSteps?: number
    onNext?: () => void
    onPrevious?: () => void
    onSkip?: () => void
    onFinish?: () => void
}

type WalkthroughProps = {
    steps: StepProps[]
    onFinish: () => void
}

const Step: React.FC<StepProps> = ({
    target,
    title,
    content,
    isVisible,
    currentStep,
    totalSteps,
    onNext,
    onPrevious,
    onSkip,
    onFinish,
}) => {
    const [position, setPosition] = useState<{
        top: number; left: number,

    }>()
    console.log("position", position)
    useEffect(() => {
        if (target && isVisible) {
            const { x, y, width, height } = target
            const centerX = x + width / 2
            const centerY = y + height / 2

            const cardWidth = 400
            const cardHeight = 300 // Approximate height, adjust as needed

            let top = centerY > window.innerHeight / 2 ? y - cardHeight - 20 : y + height + 20
            let left = centerX - cardWidth / 2
            // Ensure the card stays within the viewport
            top = Math.max(10, Math.min(top, window.innerHeight - cardHeight - 10))
            left = Math.max(10, Math.min(left, window.innerWidth - cardWidth - 10))
            setPosition({ top, left })
        }
    }, [target, isVisible])

    if (!isVisible || !position) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
            {target && (
                <div
                    className="absolute border-2 border-white bg-white bg-opacity-20 rounded"
                    style={{
                        left: target.x - 5,
                        top: target.y - 5,
                        width: target.width + 10,
                        height: target.height + 10,
                    }}
                />
            )}
            <Card
                className="absolute w-full  md:w-1/3  md:left-1/3 "
                style={{
                    top: position.top


                }}
            >
                <Button
                    variant="destructive"
                    className="absolute top-4 right-4"
                    onClick={onFinish}
                >
                    Stop Tutorial
                </Button>
                <CardHeader>
                    <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{content}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                    {currentStep! > 0 && (
                        <Button variant="outline" onClick={onPrevious}>
                            Previous
                        </Button>
                    )}
                    {currentStep! < totalSteps! - 1 ? (
                        <Button onClick={onNext}>Next</Button>
                    ) : (
                        <Button onClick={onSkip}>Finish</Button>
                    )}
                </CardFooter>
            </Card>

        </div >
    )
}

export const Walkthrough: React.FC<WalkthroughProps> = ({ steps, onFinish }) => {
    const [currentStep, setCurrentStep] = useState(0)
    const [showWalkthrough, setShowWalkthrough] = useState(true)
    const { data, setData } = useWalkThrough();

    // useEffect(() => {
    //     const checkFirstSignIn = async () => {
    //         const isFirstSignIn = localStorage.getItem("isFirstSignIn")
    //         if (isFirstSignIn === "false") {
    //             setShowWalkthrough(false)
    //         }
    //     }
    //     checkFirstSignIn()
    // }, [])

    const onStop = () => {
        if (typeof window !== "undefined") {
            localStorage.setItem("isFirstSignIn", "false");
            setData({ showWalkThrough: false });
        }
        onFinish();
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const skip = () => {
        onFinish()
    }

    if (!showWalkthrough) return null

    return (
        <AnimatePresence>
            {showWalkthrough && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {steps.map((step, index) => (
                        <Step
                            key={index}
                            {...step}
                            isVisible={index === currentStep}
                            currentStep={currentStep}
                            totalSteps={steps.length}
                            onNext={nextStep}
                            onPrevious={prevStep}
                            onFinish={onStop}
                            onSkip={skip}
                        />
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
