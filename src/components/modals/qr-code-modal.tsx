"use client"

import type React from "react"

import { useState, Suspense, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/shadcn/ui/dialog"
import { Button } from "~/components/shadcn/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/shadcn/ui/card"
import { Badge } from "~/components/shadcn/ui/badge"
import { Separator } from "~/components/shadcn/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/shadcn/ui/tabs"
import { Download, ExternalLink, Calendar, Box, FileText, Copy, Share2, Eye, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import QRCode from "react-qr-code"
import * as THREE from "three"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { OrbitControls, Environment, Html, useProgress } from "@react-three/drei"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { Loader2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"
import type { QRItem } from "~/types/qr"

interface QRCodeModalProps {
    isOpen: boolean
    onClose: () => void
    qrItem: QRItem
}

export default function QRCodeModal({ isOpen, onClose, qrItem }: QRCodeModalProps) {
    const [showDetails, setShowDetails] = useState(false)
    const [activeTab, setActiveTab] = useState("qr")

    // Generate QR code data URL
    const qrData = JSON.stringify({
        id: qrItem.id,
    })

    const handleDownloadQR = () => {
        const svg = document.getElementById("qr-code-svg")
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg)
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")
            const img = new Image()
            canvas.width = 300
            canvas.height = 300

            img.onload = () => {
                if (ctx) {
                    ctx.fillStyle = "white"
                    ctx.fillRect(0, 0, 300, 300)
                    ctx.drawImage(img, 0, 0, 300, 300)
                    const link = document.createElement("a")
                    link.download = `qr-${qrItem.title.replace(/\s+/g, "-").toLowerCase()}.png`
                    link.href = canvas.toDataURL()
                    link.click()
                    toast.success("QR code downloaded!")
                }
            }
            img.src = "data:image/svg+xml;base64," + btoa(svgData)
        }
    }

    const handleCopyData = () => {
        navigator.clipboard.writeText(qrData)
        toast.success("QR data copied to clipboard!")
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: qrItem.title,
                    text: qrItem.descriptions?.[0]?.content ?? "QR Item",
                    url: window.location.origin,
                })
            } catch (error) {
                console.error("Error sharing:", error)
                handleCopyData()
            }
        } else {
            handleCopyData()
        }
    }

    const isActive = () => {
        const now = new Date()
        return now >= new Date(qrItem.startDate) && now <= new Date(qrItem.endDate)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        QR Code Details - {qrItem.title}
                        <Badge variant={isActive() ? "default" : "secondary"}>{isActive() ? "Active" : "Inactive"}</Badge>
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="qr">QR Code</TabsTrigger>
                        <TabsTrigger value="model" disabled={!qrItem.modelUrl}>
                            3D Model {qrItem.modelUrl && <Box className="ml-1 h-3 w-3" />}
                        </TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>

                    <TabsContent value="qr" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* QR Code Section */}
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader className="text-center">
                                        <CardTitle>QR Code</CardTitle>
                                        <CardDescription>Scan this code to view the content</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center space-y-4">
                                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                                            <QRCode
                                                id="qr-code-svg"
                                                value={qrData}
                                                size={256}
                                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                viewBox="0 0 256 256"
                                            />
                                        </div>
                                        <div className="flex gap-2 w-full">
                                            <Button onClick={handleDownloadQR} className="flex-1 gap-2">
                                                <Download className="h-4 w-4" />
                                                Download
                                            </Button>
                                            <Button onClick={handleShare} variant="outline" className="flex-1 gap-2 bg-transparent">
                                                <Share2 className="h-4 w-4" />
                                                Share
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Item Details
                                        </CardTitle>
                                        <CardDescription>
                                            {qrItem.descriptions?.length
                                                ? `${qrItem.descriptions.length} description${qrItem.descriptions.length > 1 ? "s" : ""}`
                                                : "No descriptions"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Descriptions */}
                                        {qrItem.descriptions && qrItem.descriptions.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Descriptions</span>
                                                </div>
                                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                                    {qrItem.descriptions
                                                        .sort((a, b) => a.order - b.order)
                                                        .map((desc) => (
                                                            <div key={desc.id} className="border rounded-lg p-3 bg-muted/30">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {desc.order}
                                                                    </Badge>
                                                                    <span className="font-medium text-sm">{desc.title}</span>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {desc.content.length > 150 ? `${desc.content.slice(0, 150)}...` : desc.content}
                                                                </p>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                        <Separator />

                                        {/* 3D Model */}
                                        {qrItem.modelUrl && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Box className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">3D Model</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => setActiveTab("model")} className="gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        View Model
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => window.open(qrItem.modelUrl, "_blank")}
                                                        className="gap-1"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        Open File
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(qrItem.modelUrl)
                                                            toast.success("Model URL copied!")
                                                        }}
                                                        className="gap-1"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                        Copy URL
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* External Link */}
                                        {qrItem.externalLink && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">External Link</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => window.open(qrItem.externalLink!, "_blank")}
                                                        className="gap-1"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        Open Link
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(qrItem.externalLink!)
                                                            toast.success("Link copied!")
                                                        }}
                                                        className="gap-1"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                        Copy URL
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        <Separator />

                                        {/* QR Data */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">QR Data</span>
                                            </div>
                                            <Button size="sm" variant="ghost" onClick={handleCopyData} className="gap-1">
                                                <Copy className="h-3 w-3" />
                                                Copy QR Data
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="model" className="space-y-4">
                        {qrItem.modelUrl ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Box className="h-5 w-5" />
                                        3D Model Viewer
                                    </CardTitle>
                                    <CardDescription>Interactive 3D model - drag to rotate, scroll to zoom</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ModelViewer modelUrl={qrItem.modelUrl} height="500px" showControls={true} />
                                    <div className="mt-4 flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.open(qrItem.modelUrl, "_blank")}
                                            className="gap-1"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Open in New Tab
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                navigator.clipboard.writeText(qrItem.modelUrl)
                                                toast.success("Model URL copied!")
                                            }}
                                            className="gap-1"
                                        >
                                            <Copy className="h-3 w-3" />
                                            Copy URL
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No 3D Model</h3>
                                        <p className="text-muted-foreground">This QR item doesn{"'"}t have a 3D model attached</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="preview" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Content Preview</CardTitle>
                                <CardDescription>This is what users will see when they scan the QR code</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-2xl font-bold">{qrItem.title}</h3>
                                        </div>

                                        {/* Descriptions */}
                                        {qrItem.descriptions && qrItem.descriptions.length > 0 && (
                                            <div className="space-y-4">
                                                {qrItem.descriptions
                                                    .sort((a, b) => a.order - b.order)
                                                    .map((desc) => (
                                                        <div key={desc.id} className="bg-white p-4 rounded-lg border">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {desc.order}
                                                                </Badge>
                                                                <h4 className="font-semibold">{desc.title}</h4>
                                                            </div>
                                                            <p className="text-muted-foreground whitespace-pre-wrap">{desc.content}</p>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                Active from {format(new Date(qrItem.startDate), "MMM dd, yyyy")} to{" "}
                                                {format(new Date(qrItem.endDate), "MMM dd, yyyy")}
                                            </span>
                                        </div>

                                        {/* 3D Model Preview */}
                                        {qrItem.modelUrl && (
                                            <div className="bg-white rounded-lg border overflow-hidden">
                                                <div className="p-4 border-b">
                                                    <div className="flex items-center gap-2">
                                                        <Box className="h-5 w-5 text-blue-600" />
                                                        <span className="font-medium">Interactive 3D Model</span>
                                                    </div>
                                                </div>
                                                <ModelViewer modelUrl={qrItem.modelUrl} height="300px" showControls={false} />
                                            </div>
                                        )}

                                        {/* External Link Preview */}
                                        {qrItem.externalLink && (
                                            <div className="bg-white p-4 rounded-lg border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <ExternalLink className="h-4 w-4 text-green-600" />
                                                    <span className="font-medium">External Resource</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-3">Additional content and resources available</p>
                                                <Button size="sm" variant="outline" onClick={() => window.open(qrItem.externalLink!, "_blank")}>
                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                    Visit Link
                                                </Button>
                                            </div>
                                        )}

                                        {!isActive() && (
                                            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                                                <p className="text-sm text-yellow-800">
                                                    ⚠️ This content is currently{" "}
                                                    {new Date() < new Date(qrItem.startDate) ? "not yet active" : "expired"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

interface ModelViewerProps {
    modelUrl: string
    className?: string
    height?: string
    showControls?: boolean
}



function OBJModel({ url }: { url: string }) {
    const obj = useLoader(OBJLoader, url)
    const meshRef = useRef<THREE.Group>(null)

    // Gentle rotation animation - removed console.log
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
        }
    })

    useEffect(() => {
        if (obj) {
            // Add material to OBJ if it doesn't have one
            obj.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    if (!child.material) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0x888888,
                            roughness: 0.4,
                            metalness: 0.1,
                        })
                    }
                    child.castShadow = true
                    child.receiveShadow = true
                }
            })

            // Calculate bounding box
            const box = new THREE.Box3().setFromObject(obj)
            const size = box.getSize(new THREE.Vector3())
            const center = box.getCenter(new THREE.Vector3())
            obj.position.sub(center);
            // Center the model
            obj.position.set(0, 0, 0);

            // Scale the model to fit in a reasonable size (max dimension of 20 units for larger models)
            const maxDimension = Math.max(size.x, size.y, size.z)
            if (maxDimension > 50) {
                // For very large models, scale down more aggressively
                const scale = 20 / maxDimension
                obj.scale.setScalar(scale)
            } else if (maxDimension > 20) {
                // For medium-large models, scale down moderately
                const scale = 15 / maxDimension
                obj.scale.setScalar(scale)
            } else if (maxDimension < 1) {
                // For very small models, scale up
                const scale = 5 / maxDimension
                obj.scale.setScalar(scale)
            }
            // Models between 1-20 units keep their original size
        }
    }, [obj])

    return (
        <group ref={meshRef}>
            <primitive object={obj} />
        </group>
    )
}

function Model({ url }: { url: string }) {

    return <OBJModel url={url} />

}

function Loader() {
    const { progress } = useProgress()
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 className="h-8 w-8 animate-spin" />
                <div className="text-sm">{Math.round(progress)}% loaded</div>
            </div>
        </Html>
    )
}

function ErrorFallback({ error, onRetry, modelUrl }: { error: string; onRetry: () => void; modelUrl: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load 3D model</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2">
                <Button onClick={onRetry} size="sm" variant="outline">
                    Try Again
                </Button>
                <Button onClick={() => window.open(modelUrl, "_blank")} size="sm" variant="ghost">
                    View File
                </Button>
            </div>
        </div>
    )
}

export function ModelViewer({ modelUrl, className = "", height = "400px", showControls = true }: ModelViewerProps) {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [retryKey, setRetryKey] = useState(0)
    const controlsRef = useRef<OrbitControlsImpl>(null)

    useEffect(() => {
        if (!modelUrl) {
            setError("No model URL provided")
            setIsLoading(false)
            return
        }
        setError(null)
        setIsLoading(true)
    }, [modelUrl, retryKey])

    const handleReset = () => {
        if (controlsRef.current) {
            controlsRef.current.reset()
        }
    }

    const handleZoomIn = () => {
        if (controlsRef.current) {
            controlsRef.current.dollyIn(0.5)
            controlsRef.current.update()
        }
    }

    const handleZoomOut = () => {
        if (controlsRef.current) {
            controlsRef.current.dollyOut(0.5)
            controlsRef.current.update()
        }
    }

    const handleRetry = () => {
        setRetryKey((prev) => prev + 1)
        setError(null)
    }

    const handleError = (event: React.SyntheticEvent<HTMLDivElement, Event>) => {
        console.error("3D Model loading error:", event)
        setError(
            "Failed to load 3D model. Please check if the file is accessible and in a supported format (OBJ, GLB, GLTF).",
        )
        setIsLoading(false)
    }

    if (error) {
        return (
            <Card className={`flex items-center justify-center ${className}`} style={{ height }}>
                <ErrorFallback error={error} onRetry={handleRetry} modelUrl={modelUrl} />
            </Card>
        )
    }

    return (
        <div className={`relative ${className}`} style={{ height }}>
            <Canvas
                key={retryKey}
                camera={{ fov: 45, position: [0, 0, 25] }}
                style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                onCreated={() => setIsLoading(false)}
                gl={{ preserveDrawingBuffer: true }}
                onError={handleError}
            >
                <ambientLight intensity={0.6} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />
                <directionalLight position={[0, 10, 0]} intensity={0.5} />

                <Suspense fallback={<Loader />}>
                    <Model url={modelUrl} />
                    <Environment preset="sunset" />
                </Suspense>

                <OrbitControls
                    ref={controlsRef}
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    autoRotate={false}
                    autoRotateSpeed={0.5}
                    maxDistance={100}
                    minDistance={0.5}
                    maxPolarAngle={Math.PI}
                    minPolarAngle={0}
                    zoomSpeed={1.2}
                    panSpeed={1.0}
                    rotateSpeed={1.0}
                />
            </Canvas>

            {showControls && (
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <Button size="sm" variant="secondary" onClick={handleReset} className="bg-white/80 hover:bg-white">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleZoomIn} className="bg-white/80 hover:bg-white">
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleZoomOut} className="bg-white/80 hover:bg-white">
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <div className="text-sm text-muted-foreground">Loading 3D model...</div>
                    </div>
                </div>
            )}
        </div>
    )
}
