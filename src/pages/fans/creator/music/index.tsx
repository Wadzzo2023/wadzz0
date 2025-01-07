import { Music, PlusCircle } from "lucide-react";
import React, { useState } from "react";
import AlbumList from "~/components/fan/creator/music/album-list";
import CreateAlbum from "~/components/fan/creator/music/create-album";
import { Button } from "~/components/shadcn/ui/button";
import CreatorLayout from "../layout";
import { api } from "~/utils/api";

const CreatorMusic: React.FC = () => {
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
        <CreatorLayout>
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

                <div className=" flex flex-col gap-2">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Albums</h2>
                        <AlbumList />
                    </div>
                    <div>
                        <UnlistedSongsList />
                    </div>
                </div>
            </div>
        </CreatorLayout>
    );
};
export default CreatorMusic;



const UnlistedSongsList: React.FC = () => {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = api.fan.music.getUnlistedSongs.useInfiniteQuery(
        { limit: 10 },
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        }
    );

    if (status === "loading") return <div>Loading...</div>;
    if (status === "error") return <div>Error fetching unlisted songs</div>;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Unlisted Songs</h2>
            <ul className="space-y-4">
                {
                    data.pages[0]?.nfts.length === 0 && (
                        <div className="text-center text-gray-500">No unlisted songs found</div>
                    )
                }
                {data.pages.map((page, i) => (
                    <React.Fragment key={i}>
                        {page.nfts.map((song) => (
                            <li key={song.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center">
                                    <Music className="mr-3 text-gray-500" />
                                    <span className="font-medium">{song.asset.name}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-500 mr-4">{song.asset.code}</span>

                                </div>
                            </li>
                        ))}
                    </React.Fragment>
                ))}
            </ul>
            {hasNextPage && (
                <div className="mt-4 text-center">
                    <Button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? "Loading more..." : "Load More"}
                    </Button>
                </div>
            )}
        </div>
    );
};
