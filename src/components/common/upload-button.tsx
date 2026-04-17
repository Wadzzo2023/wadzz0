"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import toast from "react-hot-toast"
import { api } from "~/utils/api"
import axios, { AxiosError } from "axios"
import type { EndPointType } from "~/server/s3"
import { Button } from "~/components/shadcn/ui/button"
import {
    Camera,
    Loader2,
    Paperclip,
    Upload,
    File,
    ImageIcon,
    Music,
    Video,
    FileText,
    X,
    Check,
    AlertCircle,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "~/lib/utils"

const computeSHA256 = async (file: File) => {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    return hashHex
}

const getFileIcon = (fileType: string, fileName: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (fileType.startsWith("video/")) return <Video className="h-4 w-4" />
    if (fileType.startsWith("audio/")) return <Music className="h-4 w-4" />
    if (fileType.includes("pdf")) return <FileText className="h-4 w-4" />
    if (fileName.endsWith(".obj")) return <File className="h-4 w-4" />
    return <File className="h-4 w-4" />
}

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB"
    else return (bytes / 1073741824).toFixed(1) + " GB"
}

export function UploadS3Button({
    id,
    endpoint,
    onBeforeUploadBegin,
    onUploadProgress,
    onClientUploadComplete,
    onUploadError,
    disabled,
    type,
    variant = "button",
    className,
    label,
    showPreview = true,
    ref
}: {
    id?: string
    endpoint: EndPointType
    onUploadProgress?: (p: number) => void
    onClientUploadComplete?: (file: { url: string }) => void
    onBeforeUploadBegin?: (files: File) => Promise<File> | File | undefined;
    onUploadError?: (error: Error) => void
    disabled?: boolean
    type?: "profile" | "cover"
    variant?: "button" | "input" | 'hidden'
    className?: string
    label?: string
    showPreview?: boolean
    ref?: React.Ref<HTMLInputElement>
}) {
    const [progress, setProgress] = useState(0)
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const url = api.s3.getSignedURL.useMutation({
        onSuccess: async (data) => {
            setLoading(true)
            setUploadStatus("uploading")
            try {
                if (file) {
                    const res = await axios.put(data.uploadUrl, file, {
                        headers: {
                            "Content-Type": file.type,
                        },
                        onUploadProgress: (progressEvent) => {
                            if (progressEvent.total) {
                                const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                                setProgress(percentage)
                                onUploadProgress?.(percentage)
                            }
                        },
                    })

                    if (res.status === 200) {
                        setUploadStatus("success")
                        onClientUploadComplete?.({ url: data.fileUrl })

                        // Reset after success animation
                        setTimeout(() => {
                            if (variant === "input") {
                                setFile(null)
                                setPreviewUrl(null)
                                setUploadStatus("idle")
                            }
                        }, 2000)
                    }
                }
            } catch (error) {
                setUploadStatus("error")
                if (error instanceof AxiosError) {
                    console.error("Status:", error.response?.status)
                    console.error("Message:", error.message)
                    console.error("Response data:", error.response?.data)
                    onUploadError?.(error)
                }
                console.error("Failed to upload file", error)

                // Reset after error animation
                setTimeout(() => {
                    setUploadStatus("idle")
                }, 2000)
            } finally {
                setLoading(false)
            }
        },
        onError: (error) => {
            setUploadStatus("error")
            toast.error(error.message)
            setTimeout(() => {
                setUploadStatus("idle")
            }, 2000)
        },
    })

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0]

        if (selectedFile) {
            const isOBJFile = selectedFile.name.endsWith(".obj");
            const isGLBFile = selectedFile.name.endsWith(".glb");
            const fileType = isOBJFile ? ".obj" : isGLBFile ? ".glb" : selectedFile.type;

            let targetFile = selectedFile
            if (onBeforeUploadBegin) {
                const processedFile = await onBeforeUploadBegin(selectedFile)
                if (!processedFile) {
                    return
                }
                targetFile = processedFile
            }

            setFile(targetFile)

            // Create preview for images
            if (targetFile.type.startsWith("image/") && showPreview) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    setPreviewUrl(e.target?.result as string)
                }
                reader.readAsDataURL(targetFile)
            } else {
                setPreviewUrl(null)
            }

            url.mutate({
                fileSize: targetFile.size,
                fileType: fileType,
                checksum: await computeSHA256(targetFile),
                endPoint: endpoint,
                fileName: targetFile.name,
            })
        } else {
            console.error("No file selected")
        }
    }

    const handleButtonClick = useCallback(() => {
        fileInputRef.current?.click()
    }, [])

    const renderButtonContent = () => {
        if (loading) {
            return (
                <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{progress}%</span>
                </div>
            )
        }

        if (uploadStatus === "success") {
            return (
                <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Uploaded</span>
                </div>
            )
        }

        if (uploadStatus === "error") {
            return (
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Failed</span>
                </div>
            )
        }

        return (
            <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>{label ?? "Upload Media"}</span>
            </div>
        )
    }

    const renderInputContent = () => {
        if (loading) {
            return <Loader2 className="h-4 w-4 animate-spin" />
        }

        if (uploadStatus === "success") {
            return <Check className="h-4 w-4 text-green-500" />
        }

        if (uploadStatus === "error") {
            return <AlertCircle className="h-4 w-4 text-red-500" />
        }

        return <Camera className="h-4 w-4" />
    }

    return (
        <div
            className="grid w-full items-center gap-2">
            {variant === "button" && (
                <motion.div whileTap={{ scale: 0.97 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                    <Button
                        variant={uploadStatus === "success" ? "outline" : "destructive"}
                        type="button"
                        className={cn(
                            "relative shadow-sm shadow-black overflow-hidden transition-all duration-300",
                            uploadStatus === "success" && "border-green-500 text-green-500",
                            uploadStatus === "error" && "bg-red-600",
                            className,
                        )}
                        disabled={disabled ?? loading}
                        onClick={handleButtonClick}
                    >
                        {loading && (
                            <motion.div
                                className="absolute left-0 bottom-0 h-1 bg-primary-foreground"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ type: "tween" }}
                            />
                        )}
                        {renderButtonContent()}
                    </Button>
                </motion.div>
            )}
            {variant === "hidden" && (
                //don't show anything
                <></>
            )}
            {variant === "input" && (
                <div className="relative">
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <Button
                            size="icon"
                            variant={uploadStatus === "success" ? "outline" : "secondary"}
                            className={cn(
                                "relative overflow-hidden transition-all duration-300",
                                uploadStatus === "success" && "border-green-500",
                                uploadStatus === "error" && "border-red-500",
                                className,
                            )}
                            disabled={disabled ?? loading}
                            onClick={handleButtonClick}
                        >
                            {loading && (
                                <motion.div
                                    className="absolute left-0 bottom-0 h-1 bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ type: "tween" }}
                                />
                            )}
                            {renderInputContent()}
                        </Button>
                    </motion.div>

                    <AnimatePresence>
                        {previewUrl && file && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute top-full mt-2 left-0 rounded-md border bg-background shadow-md p-1"
                            >
                                <div className="relative">
                                    <img
                                        src={previewUrl ?? "/images/action/logo.png"}
                                        alt="Preview"
                                        className="h-20 w-20 object-cover rounded"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded">
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setFile(null)
                                                setPreviewUrl(null)
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs mt-1 max-w-[80px] truncate">{file.name}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <input
                ref={fileInputRef}
                id={id ? id : `file-upload-${type}`}
                type="file"
                accept={getAcceptString(endpoint)}
                disabled={disabled ?? loading}
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    )
}

function getAcceptString(endpoint: EndPointType) {
    switch (endpoint) {
        case "imageUploader":
            return "image/jpeg,image/png,image/webp,image/gif"
        case "profileUploader":
            return "image/jpeg,image/png,image/webp,image/gif"
        case "coverUploader":
            return "image/jpeg,image/png,image/webp,image/gif"
        case "videoUploader":
            return "video/mp4,video/webm"
        case "musicUploader":
            return "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/flac,audio/alac,audio/aiff,audio/wma,audio/m4a"
        case "modelUploader":
            return ".obj,.glb";
        case "svgUploader":
            return "image/svg+xml"
        case "multiBlobUploader":
            return `
        image/jpeg,image/png,image/webp,image/gif,
        video/mp4,video/webm,
        application/vnd.google-apps.document,
        application/vnd.google-apps.spreadsheet, 
        text/plain,
        application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
        application/vnd.ms-excel, 
        text/csv, 
        text/tab-separated-values, 
        application/pdf, 
        application/vnd.oasis.opendocument.spreadsheet
      `.trim()
    }
}

export function MultiUploadS3Button({
    endpoint = "multiBlobUploader",
    onBeforeUploadBegin,
    onUploadProgress,
    onClientUploadComplete,
    onUploadError,
    variant = "button",
    className,
    label,
    showFileList = true,
    maxFiles = 10,
}: {
    endpoint?: EndPointType
    onUploadProgress?: (p: number) => void
    onClientUploadComplete?: (
        files: {
            url: string
            name: string
            size: number
            type: string
        }[],
    ) => void
    onBeforeUploadBegin?: (files: File[]) => Promise<File[]> | File[]
    onUploadError?: (error: Error) => void
    variant?: "button" | "input"
    className?: string
    label?: string
    showFileList?: boolean
    maxFiles?: number
}) {
    const [progress, setProgress] = useState(0)
    const [loading, setLoading] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [completedCount, setCompletedCount] = useState(0)
    const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const singedUrls = api.s3.getSignedMultiURLs.useMutation({
        onSuccess: async (urls, variables) => {
            setLoading(true)
            setUploadStatus("uploading")
            const finished: { url: string; name: string; size: number; type: string }[] = []
            if (!files.length) return

            try {
                for (const file of files) {
                    const data = urls.find((url) => url.fileName === file.name)
                    if (!data) continue

                    try {
                        const res = await axios.put(data.uploadUrl, file, {
                            headers: {
                                "Content-Type": file.type,
                            },
                            onUploadProgress: (progressEvent) => {
                                if (progressEvent.total) {
                                    const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                                    setProgress(percentage)
                                    onUploadProgress?.(percentage)
                                }
                            },
                        })

                        if (res.status === 200) {
                            finished.push({
                                url: data.fileUrl,
                                name: file.name,
                                size: file.size,
                                type: file.type,
                            })
                            setCompletedCount((prevCount) => prevCount + 1)
                        }
                    } catch (error) {
                        if (error instanceof AxiosError) {
                            console.error("Status:", error.response?.status)
                            console.error("Message:", error.message)
                            console.error("Response data:", error.response?.data)
                            onUploadError?.(error)
                        }
                        console.error("Failed to upload file", error)
                    }
                }

                if (finished.length === files.length) {
                    setUploadStatus("success")
                } else if (finished.length > 0) {
                    // Partial success
                    setUploadStatus("success")
                    toast.success(`${finished.length} of ${files.length} files uploaded successfully`)
                } else {
                    setUploadStatus("error")
                    toast.error("Failed to upload files")
                }

                onClientUploadComplete?.(finished)

                // Reset after success animation
                setTimeout(() => {
                    if (finished.length === files.length) {
                        setFiles([])
                        setCompletedCount(0)
                    }
                    setUploadStatus("idle")
                }, 2000)
            } catch (error) {
                setUploadStatus("error")
                if (error instanceof Error) {
                    onUploadError?.(error)
                }

                // Reset after error animation
                setTimeout(() => {
                    setUploadStatus("idle")
                }, 2000)
            } finally {
                setLoading(false)
            }
        },
        onError: (error) => {
            setUploadStatus("error")
            toast.error(error.message)
            setTimeout(() => {
                setUploadStatus("idle")
            }, 2000)
        },
    })

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileInputs = event.target.files

        if (fileInputs) {
            let targetFiles = Array.from(fileInputs)

            if (targetFiles.length > maxFiles) {
                toast.error(`Maximum ${maxFiles} files allowed`)
                targetFiles = targetFiles.slice(0, maxFiles)
            }

            if (onBeforeUploadBegin) {
                const processedFile = await onBeforeUploadBegin(targetFiles)
                if (!processedFile) {
                    return
                }
                targetFiles = processedFile
            }

            const filesMeta = await Promise.all(
                targetFiles.map(async (file) => {
                    return {
                        checksum: await computeSHA256(file),
                        fileSize: file.size,
                        fileName: file.name,
                        fileType: file.type,
                        endPoint: endpoint,
                    }
                }),
            )

            setFiles(targetFiles)
            setCompletedCount(0)

            singedUrls.mutate({
                files: filesMeta,
                endPoint: endpoint,
            })
        } else {
            console.error("No file selected")
        }
    }

    const handleButtonClick = useCallback(() => {
        fileInputRef.current?.click()
    }, [])

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const renderButtonContent = () => {
        if (loading) {
            return (
                <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{progress}%</span>
                    <span className="text-xs">
                        ({completedCount}/{files.length})
                    </span>
                </div>
            )
        }

        if (uploadStatus === "success") {
            return (
                <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Uploaded {completedCount} files</span>
                </div>
            )
        }

        if (uploadStatus === "error") {
            return (
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Upload Failed</span>
                </div>
            )
        }

        return (
            <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>{label ?? "Upload Files"}</span>
            </div>
        )
    }

    const renderInputContent = () => {
        if (loading) {
            return <Loader2 className="h-4 w-4 animate-spin" />
        }

        if (uploadStatus === "success") {
            return <Check className="h-4 w-4 text-green-500" />
        }

        if (uploadStatus === "error") {
            return <AlertCircle className="h-4 w-4 text-red-500" />
        }

        return <Paperclip className="h-4 w-4" />
    }

    return (
        <div className="grid items-center gap-2">
            {variant === "button" && (
                <motion.div whileTap={{ scale: 0.97 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                    <Button
                        type="button"
                        variant={uploadStatus === "success" ? "outline" : "destructive"}
                        className={cn(
                            "relative shadow-sm shadow-black overflow-hidden transition-all duration-300",
                            uploadStatus === "success" && "border-green-500 text-green-500",
                            uploadStatus === "error" && "bg-red-600",
                            className,
                        )}
                        onClick={handleButtonClick}
                        disabled={loading}
                    >
                        {loading && (
                            <motion.div
                                className="absolute left-0 bottom-0 h-1 bg-primary-foreground"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ type: "tween" }}
                            />
                        )}
                        {renderButtonContent()}
                    </Button>
                </motion.div>
            )}

            {variant === "input" && (
                <motion.div
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <Button
                        size="icon"
                        variant={uploadStatus === "success" ? "outline" : "secondary"}
                        className={cn(
                            "relative overflow-hidden transition-all duration-300",
                            uploadStatus === "success" && "border-green-500",
                            uploadStatus === "error" && "border-red-500",
                            className,
                        )}
                        type="button"
                        onClick={handleButtonClick}
                        disabled={loading}
                    >
                        {loading && (
                            <motion.div
                                className="absolute left-0 bottom-0 h-1 bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ type: "tween" }}
                            />
                        )}
                        {renderInputContent()}
                    </Button>
                </motion.div>
            )}

            <input
                ref={fileInputRef}
                id={`file-upload-${endpoint}`}
                type="file"
                accept={getAcceptString(endpoint)}
                className="hidden"
                multiple
                onChange={handleFileChange}
            />

            {showFileList && files.length > 0 && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 border rounded-md overflow-hidden"
                    >
                        <div className="max-h-40 overflow-y-auto">
                            {files.map((file, index) => (
                                <motion.div
                                    key={file.name + index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                        "flex items-center justify-between p-2 text-sm",
                                        index % 2 === 0 ? "bg-muted/50" : "bg-background",
                                    )}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {getFileIcon(file.type, file.name)}
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                        <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                                    </div>

                                    {!loading && (
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeFile(index)}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}

                                    {loading && index < completedCount && <Check className="h-4 w-4 text-green-500" />}

                                    {loading && index >= completedCount && (
                                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    )
}

