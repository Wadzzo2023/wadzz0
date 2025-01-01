import { PlusCircle } from "lucide-react";
import { useState } from "react";
import AlbumList from "~/components/fan/creator/music/album-list";
import CreateAlbum from "~/components/fan/creator/music/create-album";
import { Button } from "~/components/shadcn/ui/button";

const CreatorMusic: React.FC = () => {
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
        <div className=" p-4 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Your Music Collection</h1>
                <p className="text-gray-600">Manage and explore your album catalog</p>
            </header>
            <div className="flex justify-end mb-8">
                <CreateAlbum
                    open={dialogOpen}
                    setOpen={setDialogOpen}
                />
            </div>

            <AlbumList />
        </div>
    );
};
export default CreatorMusic;