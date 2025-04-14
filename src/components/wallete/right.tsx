import React from "react";
import { useRightStore } from "~/lib/state/wallete/right";
import CopyToClip from "./copy_to_Clip";
import Link from "next/link";
import Loading from "./loading";
import { extractHostnameFromURL } from "~/lib/helper/helper_client";
import MarketLayout from "./market";
import ImageVideViewer from "./Image_video_viewer";
import { useSearchTagStore } from "~/lib/state/wallete/search_tag";
import { useSearchOpenStore } from "~/lib/state/wallete/searchOpen";
import { addrShort } from "~/utils/utils";
import { api } from "~/utils/api";
import MyError from "./my_error";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import { Button } from "../shadcn/ui/button";
interface RightProps {
  key?: React.Key;
}

function Right(_props: RightProps) {
  const stStore = useSearchTagStore();
  const soStore = useSearchOpenStore();
  const { currentData } = useRightStore();
  if (!currentData)
    return (
      <div className="flex h-full w-full  items-start justify-center">
        <MyError text="No item selected" />
      </div>
    );
  const {
    codeIssuer,
    logoBlueData,
    logoUrl,
    link,
    description,
    color,
    tags,
    code,
    Litemint,
    StellarTerm,
    StellarX,
  } = currentData;

  const availableMarket = [
    { title: "Litemint", link: Litemint },
    { title: "StellarTerm", link: StellarTerm },
    { title: "StellarX", link: StellarX },
  ].filter((el) => el.link !== null);

  return (
    <div className="h-full ">
      <div className="scrollbar-style relative h-full w-full  rounded-xl bg-base-100/90">
        <div
          className="absolute h-full w-full opacity-10"
          style={{
            backgroundColor: color,
          }}
        />
        <div className="flex h-full flex-col justify-between space-y-2 p-2">
          <div className="avatar relative w-full rounded-xl border-4 border-base-100 ">
            <div className="relative m-8 w-full ">
              <ImageVideViewer
                code={code}
                color={color}
                url={logoUrl}
                blurData={logoBlueData}
              />
            </div>
            <p className="absolute bottom-2 flex w-full justify-center font-semibold">
              {code}
            </p>
          </div>

          <div className="relative space-y-2 overflow-y-auto rounded-box border-4 border-base-100 p-4 text-sm tracking-wider scrollbar-hide">
            <div className="space-y-1 ">
              <div className="flex items-center justify-between gap-1">
                <p>
                  <span className="font-semibold">Asset Code:</span> {code}
                </p>
                <CopyToClip text={code} />
              </div>
              <div className="flex items-center justify-between gap-1">
                <p>
                  <span className="font-semibold">Issuer Address:</span>{" "}
                  {addrShort(codeIssuer, 3)}
                </p>
                <CopyToClip text={codeIssuer} collapse={5} />
              </div>
            </div>
            <div>
              <p className="font-semibold">Description:</p>
              <p>{description} </p>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Link:</span>{" "}
                <Link
                  href={link}
                  target="_blank"
                  className="link-hover relative"
                >
                  {extractHostnameFromURL(link)}
                </Link>
              </div>
              {availableMarket.length != 0 && (
                <div>
                  <p className="font-semibold">Trade/ Buy on:</p>
                  <div className="my-1 flex flex-wrap gap-1">
                    {availableMarket.map((market, i) => (
                      <MarketLayout
                        key={i}
                        title={market.title}
                        link={market.link!}
                        color={color}
                        logoImg={{ blurData: logoBlueData, url: logoUrl }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="font-semibold">Tags:</p>
                <div
                  style={{
                    scrollbarGutter: "stable",
                  }}
                  className="scrollbar-style my-1 flex max-h-32 flex-wrap gap-1 overflow-y-auto"
                >
                  {tags.map((tag, i) => (
                    <button
                      onClick={() => {
                        stStore.setData!({
                          name: "Tag for",
                          queryParams: `?tag=${tag.tagName}`,
                          value: tag.tagName,
                        });
                        soStore.setOpen(false);
                      }}
                      key={i}
                      className="btn btn-xs text-xs normal-case"
                    >
                      {tag.tagName}
                    </button>
                  ))}
                </div>
              </div>
              <DeleteWallateAsset id={currentData.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Right;

function DeleteWallateAsset({ id }: { id: number }) {
  const { setData } = useRightStore();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const admin = api.wallate.admin.checkAdmin.useQuery();

  const del = api.wallate.asset.deleteAsset.useMutation({
    onSuccess: () => {
      setData(undefined);
    },
  });

  if (admin.data)
    return (
      <div className="flex flex-col gap-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="btn btn-primary btn-sm my-2 w-full transition duration-500 ease-in-out">
              {del.isLoading && <span className="loading loading-spinner" />}
              Delete
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmation </DialogTitle>
            </DialogHeader>
            <div className="mt-6 w-full space-y-6 sm:mt-8 lg:mt-0 lg:max-w-xs xl:max-w-md">
              <div className="flow-root">
                <div className="-my-3 divide-y divide-gray-200 dark:divide-gray-800">
                  <dl className="flex items-center justify-between gap-4 py-3">
                    <dd className="text-base font-medium text-gray-900 dark:text-white">
                      Do you want to disable this item from the market?
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <DialogFooter className=" w-full">
              <div className="flex w-full gap-4  ">
                <DialogClose className="w-full">
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  disabled={del.isLoading}
                  variant="destructive"
                  type="submit"
                  onClick={() => del.mutate(id)}
                  className="w-full"
                >
                  Confirm
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      // <button
      //   className="btn btn-primary btn-sm w-full"
      //   onClick={() => del.mutate(id)}
      // >
      //   {del.isLoading && <span className="loading loading-spinner" />}Delete
      // </button>
    );
}
