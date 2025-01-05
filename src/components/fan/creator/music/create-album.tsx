import { useState } from "react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import { Button } from "~/components/shadcn/ui/button";
import { Input } from "~/components/shadcn/ui/input";
import { Label } from "~/components/shadcn/ui/label";
import { SubmitHandler, useForm } from "react-hook-form";
import { PlusCircle } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { UploadS3Button } from "~/pages/test";
import { z } from "zod";
import { api } from "~/utils/api";
interface CreateAlbumDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}
export const AlbumCreateFormShema = z.object({
    name: z
        .string()
        .max(20, { message: "Album name must be between 3 to 20 characters" })
        .min(3, { message: "Album name must be between 3 to 20 characters" }),
    description: z.string(),
    coverImgUrl: z.string({
        required_error: "Cover image is required",
        message: "Cover image is required",
    }),
});
type AlbumFormType = z.TypeOf<typeof AlbumCreateFormShema>;

const CreateAlbum = ({ open, setOpen }: CreateAlbumDialogProps) => {
    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<AlbumFormType>();

    const [coverUrl, setCoverUrl] = useState<string>();

    const CreateAlbumMutation = api.fan.music.createAlbum.useMutation({
        onSuccess: () => {
            setOpen(false);
            toast.success("Album created successfully");
            handleOpenChange(false);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const onSubmit: SubmitHandler<z.infer<typeof AlbumCreateFormShema>> = (
        data,
    ) => {
        console.log(data);
        if (data.coverImgUrl === undefined) {
            toast.error("Cover image is required");
            return;
        }

        CreateAlbumMutation.mutate(data);

    };
    const handleOpenChange = (openState: boolean) => {
        if (!openState) {
            reset();
            setCoverUrl(undefined);
        }
        setOpen(openState);
    };
    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Album
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-purple-700">
                        Add New Album
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-2">
                        <input
                            {...register("name")}
                            type="text"
                            required
                            placeholder="Album Name"
                            className="input input-sm input-bordered  w-full"
                        />
                        <input
                            {...register("description")}
                            type="text"
                            required
                            placeholder="Description"
                            className="input input-sm input-bordered w-full"
                        />

                        <UploadS3Button
                            endpoint="imageUploader"
                            onClientUploadComplete={(res) => {
                                const data = res;
                                if (data?.url) {
                                    setCoverUrl(data.url);
                                    setValue("coverImgUrl", data.url);
                                }
                            }}
                            onUploadError={(error: Error) => {
                                // Do something with the error.
                                toast.error(`ERROR! ${error.message}`);
                            }}
                        />
                        {errors.coverImgUrl && (
                            <p className="text-red-500 text-xs">
                                {errors.coverImgUrl.message}
                            </p>
                        )}
                        {coverUrl && (
                            <Image
                                alt="preview image"
                                src={coverUrl}
                                width={200}
                                height={200}
                            />
                        )}
                    </div>

                </form>
                <DialogFooter>
                    <Button type="submit" className="w-full"
                        onClick={handleSubmit(onSubmit)}

                        disabled={CreateAlbumMutation.isLoading}
                    >
                        {CreateAlbumMutation.isLoading ? "Creating..." : "Create Album"}
                    </Button>
                </DialogFooter>
            </DialogContent>

        </Dialog>
    );
};
export default CreateAlbum;
