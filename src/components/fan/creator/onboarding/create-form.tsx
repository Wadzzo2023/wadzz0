"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Upload,
  User,
  FileText,
  ImageIcon,
  LinkIcon,
  ArrowRight,
  ArrowLeft,
  CheckCheck,
  Sparkles,
  Plus,
  ChevronRight,
  AlertCircle,
  ClipboardCheck,
  PanelTop,
  XCircle,
  Loader2,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";
import { Input } from "~/components/shadcn/ui/input";
import { Textarea } from "~/components/shadcn/ui/textarea";
import { Label } from "~/components/shadcn/ui/label";
import { RadioGroupItem } from "~/components/shadcn/ui/radio-group";
import { Card, CardContent } from "~/components/shadcn/ui/card";
import { cn } from "~/lib/utils";
import { RadioGroup } from "~/components/shadcn/ui/radio-group";
import { Badge } from "~/components/shadcn/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/shadcn/ui/tabs";
import { ipfsHashToUrl as ipfsHashToPinataGatewayUrl } from "~/utils/ipfs";

import toast from "react-hot-toast";
import { api } from "~/utils/api";
import { useRouter } from "next/navigation";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import Link from "next/link";
import { Creator } from "@prisma/client";
import { CreateBrand } from "./create-button";
import { env } from "~/env";
import { UploadS3Button } from "~/pages/test";

// ─── Schemas ────────────────────────────────────────────────────────────────

const ProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(99, "Display name must be less than 100 characters"),
  bio: z.string().optional(),
});

const AssetNameSchema = z
  .string()
  .min(4, "Asset name must be at least 4 characters")
  .max(12, "Asset name must be less than 13 characters")
  .regex(/^[a-zA-Z]+$/, "Asset name can only contain letters (a-z, A-Z)");

export const RequestBrandCreateFormSchema = z
  .object({
    profileUrl: z.string().url().optional(),
    profileUrlPreview: z.string().optional(),
    coverUrl: z.string().url().optional().or(z.literal("")),
    coverImagePreview: z.string().optional(),
    displayName: z
      .string()
      .min(1, "Display name is required")
      .max(99, "Display name must be less than 100 characters"),
    bio: z.string().optional(),
    assetType: z.enum(["new", "custom"]),
    assetName: z.string().default(""),
    assetImage: z.string().url().optional(),
    assetImagePreview: z.string().optional(),
    assetCode: z.string().default(""),
    issuer: z.string().default(""),
    vanityUrl: z.string().default(""),
  })
  .refine(
    (data) => {
      if (data.assetType === "new") {
        return !!data.assetImage;
      }
      return true;
    },
    {
      message: "Asset image is required for new assets",
      path: ["assetImage"],
    },
  );

type FormData = z.infer<typeof RequestBrandCreateFormSchema>;
type FormErrors = { [K in keyof FormData]?: string[] };

// ─── Props ───────────────────────────────────────────────────────────────────

interface BrandCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  creator?: CreateBrand | null;
  edit?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BrandCreationForm({
  isOpen,
  onClose,
  creator,
  edit,
}: BrandCreationFormProps) {
  const router = useRouter();

  // ── Step state ──────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // ── Form state ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<FormData>({
    profileUrl: creator?.profileUrl ?? "",
    profileUrlPreview: creator?.profileUrl ?? "",
    coverUrl: creator?.coverUrl ?? "",
    coverImagePreview: creator?.coverUrl ?? "",
    displayName: creator?.name ?? "",
    bio: creator?.bio ?? "",
    assetType: "new",
    assetName: creator?.pageAsset?.code ?? "",
    assetImage: creator?.pageAsset?.thumbnail ?? "",
    assetImagePreview: creator?.pageAsset?.thumbnail ?? "",
    assetCode: "",
    issuer: "",
    vanityUrl: creator?.vanityURL ?? "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // ── Upload state ─────────────────────────────────────────────────────────
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeImageTab, setActiveImageTab] = useState("profile");

  // ── Vanity URL state ─────────────────────────────────────────────────────
  const [isVanityUrlAvailable, setIsVanityUrlAvailable] = useState<
    boolean | null
  >(null);
  const [isCheckingVanityUrl, setIsCheckingVanityUrl] = useState(false);

  // ── Trust state ──────────────────────────────────────────────────────────
  const [isTrusted, setIsTrusted] = useState(false);
  const [isTrusting, setIsTrusting] = useState(false);

  // ── Derived validation ───────────────────────────────────────────────────
  const isAssetNameValid =
    formData.assetName.length > 0 && !formErrors.assetName?.length;
  const isassetCodeValid =
    formData.assetCode.length > 0 && !formErrors.assetCode?.length;
  const isIssuerValid =
    formData.issuer.length > 0 && !formErrors.issuer?.length;

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isUploading) setUploadProgress(0);
  }, [isUploading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.vanityUrl && formData.vanityUrl.length > 0) {
        checkAvailability.mutate({ vanityURL: formData.vanityUrl });
      } else {
        setIsVanityUrlAvailable(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.vanityUrl]);

  useEffect(() => {
    if (isTrusted && (formData.assetCode || formData.issuer)) {
      setIsTrusted(false);
    }
  }, [formData.assetCode, formData.issuer]);

  // Reset step when modal opens/closes
  useEffect(() => {
    if (isOpen) setCurrentStep(1);
  }, [isOpen]);

  // ── API mutations ─────────────────────────────────────────────────────────
  const RequestForBrandCreation =
    api.fan.creator.requestForBrandCreation.useMutation({
      onSuccess: () => {
        toast.success("Brand creation request submitted successfully");
        setShowConfetti(true);
        setTimeout(() => {
          onClose();
          router.push("/fans/creator");
        }, 2000);
      },
      onError: (error) => {
        toast.error(`${error.data?.code}`);
      },
    });

  const checkAvailability =
    api.fan.creator.checkVanityURLAvailabilityMutation.useMutation({
      onSuccess: (data) => {
        setIsVanityUrlAvailable(data.isAvailable);
      },
      onError: () => {
        setIsVanityUrlAvailable(false);
        toast.error("Failed to check URL availability");
      },
    });

  const CheckCustomAssetValidity =
    api.fan.creator.checkCustomAssetValidity.useMutation({
      onSuccess: (data) => {
        if (data) setIsTrusted(true);
      },
      onError: () => {
        setIsTrusted(false);
        toast.error("Failed to check asset validity");
      },
    });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const validateField = (field: keyof FormData, value: string) => {
    try {
      if (field === "assetName" || field === "assetCode") {
        AssetNameSchema.parse(value);
        return { valid: true, errors: [] };
      } else if (field === "issuer") {
        z.string().length(56).parse(value);
        return { valid: true, errors: [] };
      } else if (field === "displayName") {
        ProfileSchema.shape.displayName.parse(value);
        return { valid: true, errors: [] };
      }
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: error.errors.map((e) => e.message) };
      }
      return { valid: false, errors: ["Invalid input"] };
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "assetImage",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(10);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file, file.name);
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 300);
      const res = await fetch("/api/file", {
        method: "POST",
        body: uploadFormData,
      });
      clearInterval(progressInterval);
      setUploadProgress(100);
      const ipfsHash = await res.text();
      const thumbnail = ipfsHashToPinataGatewayUrl(ipfsHash);
      setFormData((prev) => ({
        ...prev,
        assetImage: thumbnail,
        assetImagePreview: thumbnail,
      }));
      setTimeout(() => setIsUploading(false), 500);
    } catch {
      toast.error("Upload failed. Please try again.");
      setIsUploading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormData;
    setFormData({ ...formData, [fieldName]: value });
    const validation = validateField(fieldName, value);
    setFormErrors((prev) => ({
      ...prev,
      [fieldName]: validation.valid ? undefined : validation.errors,
    }));
    if (fieldName === "vanityUrl") setIsVanityUrlAvailable(null);
  };

  const handleRadioChange = (value: "new" | "custom") => {
    setFormData({ ...formData, assetType: value });
    if (value === "new") setIsTrusted(false);
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const isNextDisabled = () => {
    switch (currentStep) {
      case 2:
        return !formData.profileUrl || isUploading;
      case 3:
        try {
          ProfileSchema.parse({
            displayName: formData.displayName,
            bio: formData.bio,
          });
          return false;
        } catch {
          return true;
        }
      case 4:
        if (formData.assetType === "new") {
          const validName =
            formData.assetName.length >= 4 &&
            formData.assetName.length <= 12 &&
            /^[a-zA-Z]+$/.test(formData.assetName);
          return !validName || !formData.assetImage || isUploading;
        } else {
          const validCode =
            formData.assetCode.length >= 4 &&
            formData.assetCode.length <= 12 &&
            /^[a-zA-Z]+$/.test(formData.assetCode);
          const validIssuer = formData.issuer.length === 56;
          return !validCode || !validIssuer || !isTrusted;
        }
      case 5:
        return (
          !formData.vanityUrl ||
          formData.vanityUrl.length < 1 ||
          isVanityUrlAvailable !== true ||
          isCheckingVanityUrl
        );
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      let isValid = false;
      switch (currentStep) {
        case 1:
          isValid = true;
          break;
        case 2:
          isValid = !!formData.profileUrl && !isUploading;
          break;
        case 3:
          try {
            ProfileSchema.parse({
              displayName: formData.displayName,
              bio: formData.bio,
            });
            isValid = true;
          } catch (error) {
            if (error instanceof z.ZodError) {
              const newErrors: FormErrors = {};
              error.errors.forEach((err) => {
                const path = err.path[0];
                if (typeof path === "string") {
                  if (!newErrors[path as keyof FormData])
                    newErrors[path as keyof FormData] = [];
                  newErrors[path as keyof FormData]?.push(err.message);
                }
              });
              setFormErrors((prev) => ({ ...prev, ...newErrors }));
            }
            isValid = false;
          }
          break;
        case 4:
          if (formData.assetType === "new") {
            const validName =
              formData.assetName.length >= 4 &&
              formData.assetName.length <= 12 &&
              /^[a-zA-Z]+$/.test(formData.assetName);
            isValid = validName && !!formData.assetImage && !isUploading;
          } else {
            const validCode =
              formData.assetCode.length >= 4 &&
              formData.assetCode.length <= 12 &&
              /^[a-zA-Z]+$/.test(formData.assetCode);
            const validIssuer = formData.issuer.length === 56;
            isValid = validCode && validIssuer && isTrusted;
          }
          break;
        case 5:
          isValid =
            !!formData.vanityUrl &&
            formData.vanityUrl.length > 0 &&
            isVanityUrlAvailable === true;
          if (!isValid && formData.vanityUrl) {
            if (isVanityUrlAvailable === false) {
              toast.error("This vanity URL is already taken. Please choose another.");
            } else if (isCheckingVanityUrl) {
              toast.error("Please wait while we check URL availability.");
            }
          }
          break;
        default:
          isValid = true;
      }

      if (isValid) {
        setCurrentStep(currentStep + 1);
      } else if (currentStep === 4) {
        if (formData.assetType === "new") {
          if (!formData.assetName || formData.assetName.length < 4 || formData.assetName.length > 12) {
            toast.error("Please enter a valid asset name (4-12 letters)");
          } else if (!formData.assetImage) {
            toast.error("Please upload an asset image");
          }
        } else {
          if (!formData.assetCode || formData.assetCode.length < 4 || formData.assetCode.length > 12) {
            toast.error("Please enter a valid asset code (4-12 letters)");
          } else if (!formData.issuer || formData.issuer.length !== 56) {
            toast.error("Please enter a valid issuer (exactly 56 characters)");
          }
        }
      }
    } else {
      // Final submit
      try {
        const submissionData = {
          ...formData,
          ...(formData.assetType === "new"
            ? { assetCode: undefined, issuer: undefined }
            : {
              assetName: undefined,
              assetImage: undefined,
              assetImagePreview: undefined,
            }),
        };
        RequestForBrandCreation.mutate({
          ...submissionData,
          storagePub: creator?.storagePub,
          storageSecret: creator?.storageSecret,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const newErrors: FormErrors = {};
          error.errors.forEach((err) => {
            const path = err.path[0];
            if (typeof path === "string") {
              if (!newErrors[path as keyof FormData])
                newErrors[path as keyof FormData] = [];
              newErrors[path as keyof FormData]?.push(err.message);
            }
          });
          setFormErrors((prev) => ({ ...prev, ...newErrors }));
        }
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // ── Animation variants ────────────────────────────────────────────────────
  const pageVariants = {
    initial: { opacity: 0, scale: 0.97 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      opacity: 0,
      scale: 0.97,
      transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const stepIndicatorVariants = {
    inactive: { scale: 1, opacity: 0.5 },
    active: { scale: 1.05, opacity: 1, transition: { duration: 0.3 } },
    completed: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
  };

  const stepMeta = [
    { label: "Benefits", sub: "Why become an Artist" },
    { label: "Profile Pictures", sub: "Upload your images" },
    { label: "Artist Details", sub: "Name and bio" },
    { label: "Asset Creation", sub: "Create your assets" },
    { label: "Vanity URL", sub: "Choose your URL" },
    { label: "Overview", sub: "Review and submit" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>{edit ? "Update" : "Create"} Your Brand</DialogTitle>
        </DialogHeader>

        {/* Confetti overlay */}
        {showConfetti && (
          <div className="pointer-events-none fixed inset-0 z-50">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, opacity: [0, 1, 0] }}
                transition={{ duration: 2 }}
                className="text-4xl"
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-8 w-8" />
                  <span className="font-bold">Brand Profile Created!</span>
                  <Sparkles className="h-8 w-8" />
                </div>
              </motion.div>
            </div>
            {Array.from({ length: 80 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-full"
                initial={{
                  top: "50%",
                  left: "50%",
                  scale: 0,
                  backgroundColor: ["#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33F3"][
                    Math.floor(Math.random() * 5)
                  ],
                }}
                animate={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Body: sidebar + content */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* ── Left Sidebar ── */}
          <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-border bg-muted/30 p-4 lg:block">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-full bg-primary p-1.5">
                <ImageIcon className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">Onboarding</span>
            </div>

            <div className="space-y-1">
              {stepMeta.map((step, index) => (
                <motion.div
                  key={index}
                  variants={stepIndicatorVariants}
                  initial="inactive"
                  animate={
                    currentStep > index + 1
                      ? "completed"
                      : currentStep === index + 1
                        ? "active"
                        : "inactive"
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300",
                    currentStep === index + 1
                      ? "border border-foreground/20 bg-primary"
                      : currentStep > index + 1
                        ? "bg-primary/60"
                        : "bg-background/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
                      currentStep > index + 1
                        ? "bg-primary"
                        : currentStep === index + 1
                          ? "border-2 border-primary"
                          : "border-2 border-muted-foreground text-muted-foreground",
                    )}
                  >
                    {currentStep > index + 1 ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-xs font-medium",
                        currentStep >= index + 1
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {step.sub}
                    </p>
                  </div>
                  {currentStep === index + 1 && (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-xs font-medium">Need help?</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Questions about onboarding? Contact our support team.
              </p>
              <Link
                href="https://app.wadzzo.com/support"
                className="mt-1 block text-[10px] text-blue-500 hover:underline"
              >
                Contact Support
              </Link>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-full"
                >
                  {/* ════════════════════ STEP 1: Benefits ════════════════════ */}
                  {currentStep === 1 && (
                    <div className="p-6">
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-bold">Benefits of Becoming an Artist</h2>
                          <p className="text-sm text-muted-foreground">
                            Join our platform and unlock these exclusive benefits for artists.
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {[
                            {
                              icon: <ImageIcon className="h-5 w-5" />,
                              title: "Showcase Your Work",
                              description: "Display your portfolio to a global audience of collectors and enthusiasts.",
                            },
                            {
                              icon: <User className="h-5 w-5" />,
                              title: "Build Your Brand",
                              description: "Establish your unique identity with a personalized Artist page.",
                            },
                            {
                              icon: <LinkIcon className="h-5 w-5" />,
                              title: "Custom URL",
                              description: "Get a memorable vanity URL to share with your audience.",
                            },
                            {
                              icon: <FileText className="h-5 w-5" />,
                              title: "Asset Management",
                              description: "Create and manage your digital assets with powerful tools.",
                            },
                          ].map((benefit, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="group relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:shadow-md"
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className="absolute left-0 top-0 h-full w-1 origin-bottom scale-y-0 transform bg-primary transition-transform duration-300 group-hover:scale-y-100" />
                              <div className="flex flex-col gap-3">
                                <div className="w-fit rounded-full bg-primary/10 p-2.5">{benefit.icon}</div>
                                <div>
                                  <h3 className="font-medium">{benefit.title}</h3>
                                  <p className="mt-1 text-sm text-muted-foreground">{benefit.description}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 rounded-full bg-primary p-1.5">
                              <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-medium">Ready to get started?</h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Complete the onboarding process to start showcasing your work to the world.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ════════════════════ STEP 2: Profile & Cover ════════════════════ */}
                  {currentStep === 2 && (
                    <div className="p-6">
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-bold">Upload Your Images</h2>
                          <p className="text-sm text-muted-foreground">
                            Profile picture is required, cover image is optional.
                          </p>
                        </div>

                        <Tabs value={activeImageTab} onValueChange={setActiveImageTab} className="w-full">
                          <TabsList className="mb-6 grid w-full grid-cols-2">
                            <TabsTrigger value="profile" className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Profile Picture <span className="ml-1 text-destructive">*</span>
                            </TabsTrigger>
                            <TabsTrigger value="cover" className="flex items-center gap-2">
                              <PanelTop className="h-4 w-4" />
                              Cover Image (Optional)
                            </TabsTrigger>
                          </TabsList>

                          {/* Profile tab */}
                          <TabsContent value="profile" className="mt-0">
                            <div className="flex flex-col items-center gap-6 md:flex-row">
                              <div className="flex w-full flex-col items-center justify-center space-y-4 md:w-1/2">
                                {formData.profileUrlPreview ? (
                                  <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative h-56 w-56 overflow-hidden rounded-2xl border-2 border-primary shadow-lg"
                                  >
                                    <img
                                      src={formData.profileUrlPreview}
                                      alt="Profile preview"
                                      className="h-full w-full object-cover"
                                    />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="group relative flex h-56 w-56 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground bg-muted/50 transition-all hover:border-primary hover:bg-primary/10"

                                  >
                                    <User className="h-16 w-16 text-muted-foreground" />
                                  </motion.div>

                                )}
                                <div className="w-full max-w-xs">
                                  <UploadS3Button
                                    variant="button"
                                    endpoint="imageUploader"
                                    onClientUploadComplete={(res) => {
                                      if (res?.url) {
                                        setFormData((prev) => ({
                                          ...prev,
                                          profileUrl: res.url,
                                          profileUrlPreview: res.url,
                                        }));
                                      }
                                    }}
                                    onUploadError={(error: Error) => {
                                      toast.error(`ERROR! ${error.message}`);
                                      setIsUploading(false);
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="w-full space-y-4 md:w-1/2">
                                <div className="space-y-2 rounded-lg border p-4">
                                  <h3 className="font-medium">Profile Picture Tips</h3>
                                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                                    {[
                                      "Use a high-resolution image (at least 500×500 pixels)",
                                      "Choose a well-lit photo with good contrast",
                                      "Select an image that represents your artistic style",
                                      "Avoid busy backgrounds that distract from you",
                                    ].map((tip, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                        <span>{tip}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="rounded-lg border border-primary bg-primary/10 p-4">
                                  <div className="flex items-start gap-3">
                                    <Sparkles className="mt-1 h-4 w-4 shrink-0" />
                                    <div>
                                      <h3 className="font-medium">Make a great first impression</h3>
                                      <p className="mt-1 text-sm text-muted-foreground">
                                        Your profile picture is required and is the first thing collectors will see.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          {/* Cover tab */}
                          <TabsContent value="cover" className="mt-0">
                            <div className="flex flex-col items-center gap-6 md:flex-row">
                              <div className="flex w-full flex-col items-center justify-center space-y-4 md:w-1/2">
                                {formData.coverImagePreview ? (
                                  <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative h-40 w-full overflow-hidden rounded-xl border-2 border-primary shadow-lg"
                                  >
                                    <img
                                      src={formData.coverImagePreview}
                                      alt="Cover preview"
                                      className="h-full w-full object-cover"
                                    />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="group relative flex h-40 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground bg-muted/50 transition-all hover:border-primary hover:bg-primary/10"
                                  >
                                    <PanelTop className="h-16 w-16 text-muted-foreground" />
                                  </motion.div>
                                )}
                                <div className="w-full max-w-xs">
                                  <UploadS3Button
                                    variant="button"
                                    endpoint="imageUploader"
                                    onClientUploadComplete={(res) => {
                                      if (res?.url) {
                                        setFormData((prev) => ({
                                          ...prev,
                                          coverUrl: res.url,
                                          coverImagePreview: res.url,
                                        }));
                                      }
                                    }}
                                    onUploadError={(error: Error) => {
                                      toast.error(`ERROR! ${error.message}`);
                                      setIsUploading(false);
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="w-full space-y-4 md:w-1/2">
                                <div className="space-y-2 rounded-lg border p-4">
                                  <h3 className="font-medium">Cover Image Tips</h3>
                                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                                    {[
                                      "Use a high-resolution image (at least 1500×500 pixels)",
                                      "Choose a landscape orientation for best display",
                                      "Showcase your artwork or creative process",
                                      "Ensure important elements are centered",
                                    ].map((tip, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                        <span>{tip}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                  )}

                  {/* ════════════════════ STEP 3: Artist Details ════════════════════ */}
                  {currentStep === 3 && (
                    <div className="p-6">
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-bold">Artist Details</h2>
                          <p className="text-sm text-muted-foreground">
                            Tell us more about yourself and your artistic journey.
                          </p>
                        </div>

                        <div className="flex flex-col gap-6 md:flex-row">
                          {/* Preview column */}
                          <div className="flex w-full flex-col items-center md:w-1/3">
                            {formData.profileUrlPreview && (
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="relative h-40 w-40 overflow-hidden rounded-2xl border-2 border-primary shadow-lg"
                              >
                                <img
                                  src={formData.profileUrlPreview}
                                  alt="Profile"
                                  className="h-full w-full object-cover"
                                />
                              </motion.div>
                            )}
                            {formData.coverImagePreview && (
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="relative mt-3 h-20 w-full overflow-hidden rounded-lg border border-border shadow-md"
                              >
                                <img
                                  src={formData.coverImagePreview}
                                  alt="Cover"
                                  className="h-full w-full object-cover"
                                />
                              </motion.div>
                            )}
                            <div className="mt-3 text-center">
                              <p className="text-xs text-muted-foreground">How collectors see you</p>
                              <Button variant="link" className="mt-1 h-auto p-0 text-xs" onClick={() => setCurrentStep(2)}>
                                Change images
                              </Button>
                            </div>
                          </div>

                          {/* Fields column */}
                          <div className="w-full space-y-5 md:w-2/3">
                            <div>
                              <div className="flex justify-between">
                                <Label htmlFor="displayName" className="font-medium">Artist Name</Label>
                                <span className="text-xs text-muted-foreground">{formData.displayName.length}/99</span>
                              </div>
                              <Input
                                id="displayName"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleInputChange}
                                placeholder="Enter your artist name"
                                className="mt-1"
                                maxLength={99}
                              />
                              {formErrors.displayName?.length && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                                  <AlertCircle className="h-3 w-3" />
                                  {formErrors.displayName[0]}
                                </p>
                              )}
                              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                                <motion.div
                                  className="h-full bg-accent"
                                  animate={{ width: `${(formData.displayName.length / 99) * 100}%` }}
                                  transition={{ duration: 0.2 }}
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="bio" className="font-medium">Bio (Optional)</Label>
                              <Textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                placeholder="Tell us about yourself and your art..."
                                rows={5}
                                className="mt-1"
                              />
                            </div>

                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                              <h3 className="text-sm font-medium">Bio Writing Tips</h3>
                              <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                                {[
                                  "Share your artistic journey and what inspires you",
                                  "Mention your preferred mediums and techniques",
                                  "Include any notable exhibitions or achievements",
                                ].map((tip, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ════════════════════ STEP 4: Asset Creation ════════════════════ */}
                  {currentStep === 4 && (
                    <div className="p-6">
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-bold">Create Your Asset</h2>
                          <p className="text-sm text-muted-foreground">
                            Choose between creating a new asset or using a custom one.
                          </p>
                        </div>

                        <RadioGroup
                          value={formData.assetType}
                          onValueChange={handleRadioChange}
                          className="grid gap-3 sm:grid-cols-2"
                        >
                          {(["new", "custom"] as const).map((type) => (
                            <motion.div
                              key={type}
                              whileHover={{ scale: 1.02 }}
                              transition={{ duration: 0.2 }}
                              className={cn(
                                "relative cursor-pointer overflow-hidden rounded-xl border p-5 transition-all duration-300",
                                formData.assetType === type
                                  ? "border-primary bg-primary/10 shadow-md"
                                  : "hover:border-primary hover:bg-primary/5",
                              )}
                              onClick={() => handleRadioChange(type)}
                            >
                              <div className="absolute right-4 top-4">
                                <RadioGroupItem value={type} id={`${type}-asset`} />
                              </div>
                              <div className="flex flex-col gap-3">
                                <div className="w-fit rounded-full bg-primary/10 p-2.5">
                                  {type === "new" ? <Plus className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                </div>
                                <div>
                                  <Label htmlFor={`${type}-asset`} className="cursor-pointer font-medium">
                                    {type === "new" ? "New Asset" : "Custom Asset"}
                                  </Label>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {type === "new"
                                      ? "Create a new asset with a name and image."
                                      : "Use an existing asset code and asset issuer."}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </RadioGroup>

                        <AnimatePresence mode="wait">
                          {formData.assetType === "new" ? (
                            <motion.div
                              key="new-asset"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-5"
                            >
                              <div className="flex flex-col gap-5 md:flex-row">
                                {/* Asset name */}
                                <div className="w-full md:w-1/2">
                                  <div className="flex justify-between">
                                    <Label htmlFor="assetName" className="font-medium">Asset Name</Label>
                                    <span className={cn("text-xs", formData.assetName.length > 0 && !isAssetNameValid ? "text-destructive" : "text-muted-foreground")}>
                                      {formData.assetName.length}/4-12
                                    </span>
                                  </div>
                                  <Input
                                    id="assetName"
                                    name="assetName"
                                    value={formData.assetName}
                                    onChange={handleInputChange}
                                    placeholder="Enter asset name"
                                    className={cn("mt-1", formData.assetName.length > 0 && !isAssetNameValid && "border-destructive")}
                                    maxLength={12}
                                  />
                                  {formErrors.assetName?.length && (
                                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                                      <AlertCircle className="h-3 w-3" />{formErrors.assetName[0]}
                                    </p>
                                  )}
                                  <p className="mt-1 text-xs text-muted-foreground">4-12 letters (a-z, A-Z only)</p>
                                </div>

                                {/* Asset image */}
                                <div className="w-full md:w-1/2">
                                  <Label className="mb-2 block font-medium">Asset Image</Label>
                                  <div className="flex flex-col gap-3">
                                    {formData.assetImagePreview ? (
                                      <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="relative h-36 w-full overflow-hidden rounded-lg border-2 border-primary shadow-md"
                                      >
                                        <img
                                          src={formData.assetImagePreview}
                                          alt="Asset preview"
                                          className="h-full w-full object-cover"
                                        />
                                        {isUploading && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                                            <div className="h-2 w-3/4 overflow-hidden rounded-full bg-background">
                                              <motion.div
                                                className="h-full bg-primary"
                                                animate={{ width: `${uploadProgress}%` }}
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="flex h-36 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground bg-muted/50 transition-all hover:border-primary hover:bg-primary/10"
                                        onClick={() => document.getElementById("asset-upload")?.click()}
                                      >
                                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                      </motion.div>
                                    )}
                                    <Input
                                      id="asset-upload"
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleFileChange(e, "assetImage")}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => document.getElementById("asset-upload")?.click()}
                                      className="w-full"
                                      disabled={isUploading}
                                    >
                                      <Upload className="mr-2 h-4 w-4" />
                                      {formData.assetImage ? "Change Image" : "Upload Image"}
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <h3 className="text-sm font-medium">Asset Guidelines</h3>
                                <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                                  {[
                                    "Use high-quality images (at least 1000×1000 pixels)",
                                    "Ensure you have the rights to use the image",
                                    "Choose descriptive names for better discoverability",
                                  ].map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /><span>{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="custom-asset"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-5"
                            >
                              <div className="flex flex-col gap-5 md:flex-row">
                                {/* Asset code */}
                                <div className="w-full md:w-1/2">
                                  <div className="flex justify-between">
                                    <Label htmlFor="assetCode" className="font-medium">Asset Code</Label>
                                    <span className={cn("text-xs", formData.assetCode.length > 0 && !isassetCodeValid ? "text-destructive" : "text-muted-foreground")}>
                                      {formData.assetCode.length}/4-12
                                    </span>
                                  </div>
                                  <Input
                                    id="assetCode"
                                    name="assetCode"
                                    value={formData.assetCode}
                                    onChange={handleInputChange}
                                    placeholder="Enter asset code"
                                    className={cn("mt-1", formData.assetCode.length > 0 && !isassetCodeValid && "border-destructive")}
                                    maxLength={12}
                                  />
                                  {formErrors.assetCode?.length && (
                                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                                      <AlertCircle className="h-3 w-3" />{formErrors.assetCode[0]}
                                    </p>
                                  )}
                                </div>

                                {/* Issuer */}
                                <div className="w-full md:w-1/2">
                                  <div className="flex justify-between">
                                    <Label htmlFor="issuer" className="font-medium">Issuer</Label>
                                    <span className={cn("text-xs", formData.issuer.length > 0 && !isIssuerValid ? "text-destructive" : "text-muted-foreground")}>
                                      {formData.issuer.length}/56
                                    </span>
                                  </div>
                                  <Input
                                    id="issuer"
                                    name="issuer"
                                    value={formData.issuer}
                                    onChange={handleInputChange}
                                    placeholder="Enter issuer"
                                    className={cn("mt-1", formData.issuer.length > 0 && !isIssuerValid && "border-destructive")}
                                    maxLength={56}
                                  />
                                  {isIssuerValid && (
                                    <p className="mt-1 flex items-center gap-1 text-xs text-green-500">
                                      <CheckCircle2 className="h-3 w-3" />Valid issuer format
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="rounded-lg border border-border bg-muted/30 p-4">
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 rounded-full bg-yellow-500/20 p-1.5">
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  </div>
                                  <div>
                                    <h3 className="font-medium">Trust Required</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      You must verify this asset before continuing. This confirms the asset exists and is valid.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <Button
                                type="button"
                                onClick={() =>
                                  CheckCustomAssetValidity.mutate({
                                    assetCode: formData.assetCode,
                                    issuer: formData.issuer,
                                  })
                                }
                                disabled={!isassetCodeValid || !isIssuerValid || isTrusting || isTrusted}
                                className="w-full"
                              >
                                {CheckCustomAssetValidity.isLoading ? (
                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking…</>
                                ) : (
                                  "Check Validity"
                                )}
                              </Button>

                              {isTrusted && (
                                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                  <CheckCheck className="h-4 w-4" />
                                  Asset trusted successfully! You can now proceed.
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* ════════════════════ STEP 5: Vanity URL ════════════════════ */}
                  {currentStep === 5 && (
                    <div className="p-6">
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-bold">Choose Your Vanity URL</h2>
                          <p className="text-sm text-muted-foreground">
                            Select a custom URL that represents your brand.
                          </p>
                        </div>

                        <div className="rounded-lg border border-primary bg-primary/10 p-4">
                          <div className="flex items-start gap-3">
                            <Sparkles className="mt-1 h-4 w-4 shrink-0" />
                            <div>
                              <h3 className="font-medium">Pricing Information</h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Your vanity URL is{" "}
                                <span className="font-medium">free for the first month</span>. After that, renewal costs{" "}
                                <span className="font-medium">500 {PLATFORM_ASSET.code}</span>.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="vanityUrl" className="font-medium">Vanity URL</Label>
                          <div className="flex items-center">
                            <span className="inline-flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                              app.wadzzo.com/
                            </span>
                            <Input
                              id="vanityUrl"
                              name="vanityUrl"
                              value={formData.vanityUrl}
                              onChange={handleInputChange}
                              className="rounded-l-none"
                              placeholder="your-name"
                            />
                          </div>

                          {formData.vanityUrl && (
                            <div className="mt-1">
                              {checkAvailability.isLoading ? (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Checking availability…</span>
                                </div>
                              ) : isVanityUrlAvailable === true ? (
                                <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                                  <CheckCheck className="h-4 w-4" />
                                  <span>This URL is available!</span>
                                </div>
                              ) : isVanityUrlAvailable === false ? (
                                <div className="flex items-center gap-1 text-sm text-destructive">
                                  <XCircle className="h-4 w-4" />
                                  <span>This URL is already taken. Please choose another one.</span>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>

                        <div className="rounded-lg border border-primary bg-primary/10 p-4">
                          <h3 className="font-medium">Your Complete URL</h3>
                          <div className="mt-2 rounded-md border border-border bg-background/80 p-2.5 backdrop-blur-sm">
                            <p className="break-all font-mono text-sm">
                              app.wadzzo.com/{formData.vanityUrl || "your-name"}
                            </p>
                          </div>
                          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                            {[
                              "Easier for fans to remember and share",
                              "Strengthens your personal brand",
                              "Looks more professional in marketing materials",
                            ].map((b, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ════════════════════ STEP 6: Overview ════════════════════ */}
                  {currentStep === 6 && (
                    <div className="p-6">
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-bold">Review Your Information</h2>
                          <p className="text-sm text-muted-foreground">
                            Please review all your information before completing the onboarding process.
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {/* Artist Details */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-3 rounded-xl border p-5"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="flex items-center gap-2 font-medium">
                                <User className="h-4 w-4" /> Artist Details
                              </h3>
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCurrentStep(3)}>Edit</Button>
                            </div>

                            <div className="flex items-center gap-3">
                              {formData.profileUrlPreview ? (
                                <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-primary">
                                  <img src={formData.profileUrlPreview} alt="Profile" className="h-full w-full object-cover" />
                                </div>
                              ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                  <User className="h-7 w-7 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{formData.displayName || "Artist Name"}</p>
                                <Badge variant="outline" className="mt-1 text-xs">Artist</Badge>
                              </div>
                            </div>

                            {formData.coverImagePreview && (
                              <div>
                                <p className="mb-1 text-xs font-medium">Cover Image</p>
                                <div className="relative h-14 w-full overflow-hidden rounded-md border border-border">
                                  <img src={formData.coverImagePreview} alt="Cover" className="h-full w-full object-cover" />
                                </div>
                              </div>
                            )}

                            {formData.bio && (
                              <div>
                                <p className="mb-1 text-xs font-medium">Bio</p>
                                <p className="line-clamp-3 text-xs text-muted-foreground">{formData.bio}</p>
                              </div>
                            )}
                          </motion.div>

                          {/* Asset Details */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-3 rounded-xl border p-5"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="flex items-center gap-2 font-medium">
                                <FileText className="h-4 w-4" /> Asset Details
                              </h3>
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCurrentStep(4)}>Edit</Button>
                            </div>

                            <Badge className="text-xs">
                              {formData.assetType === "new" ? "New Asset" : "Custom Asset"}
                            </Badge>

                            {formData.assetType === "new" ? (
                              <div className="flex items-center gap-3">
                                {formData.assetImagePreview ? (
                                  <div className="relative h-10 w-10 overflow-hidden rounded-md border border-border">
                                    <img src={formData.assetImagePreview} alt="Asset" className="h-full w-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{formData.assetName || "Asset Name"}</p>
                                  <p className="text-xs text-muted-foreground">New asset</p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs font-medium">Asset Code</p>
                                  <p className="truncate text-xs text-muted-foreground">{formData.assetCode || "Not provided"}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium">Issuer</p>
                                  <p className="truncate text-xs text-muted-foreground">{formData.issuer || "Not provided"}</p>
                                </div>
                              </div>
                            )}
                          </motion.div>

                          {/* Vanity URL */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-3 rounded-xl border p-5 sm:col-span-2"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="flex items-center gap-2 font-medium">
                                <LinkIcon className="h-4 w-4" /> Vanity URL
                              </h3>
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCurrentStep(5)}>Edit</Button>
                            </div>
                            <div className="rounded-md bg-muted/50 p-2.5">
                              <p className="font-mono text-sm">
                                app.wadzzo.com/<span className="font-bold">{formData.vanityUrl || "your-name"}</span>
                              </p>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span>Free for the first month, then 500 {PLATFORM_ASSET.code} to renew</span>
                            </div>
                          </motion.div>
                        </div>

                        <div className="rounded-lg border border-primary bg-primary/10 p-4">
                          <div className="flex items-start gap-3">
                            <ClipboardCheck className="mt-1 h-5 w-5 shrink-0" />
                            <div>
                              <h3 className="font-medium">Ready to Complete</h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                By clicking Complete below, you{"'"}ll finalize your artist profile creation. You can always
                                edit your profile details later from your dashboard.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Navigation Buttons ── */}
            <div className="flex shrink-0 items-center justify-between border-t border-border px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || RequestForBrandCreation.isLoading}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>

              <Button
                type="button"
                onClick={handleNext}
                disabled={isNextDisabled() || RequestForBrandCreation.isLoading}
                className="gap-2"
              >
                {RequestForBrandCreation.isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {currentStep === totalSteps ? "Complete" : "Next"}
                {currentStep !== totalSteps && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}