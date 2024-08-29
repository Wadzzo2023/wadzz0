import { format } from "date-fns";
import {
  DatabaseZap,
  Edit,
  File,
  Paperclip,
  Trash,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { clientsign, submitSignedXDRToServer } from "package/connect_wallet";
import { submitSignedXDRToServer4User } from "package/connect_wallet/src/lib/stellar/trx/payment_fb_g";
import toast from "react-hot-toast";
import { AddBountyComment } from "~/components/fan/creator/bounty/Add-Bounty-Comment";
import ViewBountyComment from "~/components/fan/creator/bounty/View-Bounty-Comment";
import { useModal } from "~/components/hooks/use-modal-store";
import { Preview } from "~/components/preview";
import { Button } from "~/components/shadcn/ui/button";
import { Separator } from "~/components/shadcn/ui/separator";
import Avater from "~/components/ui/avater";
import useNeedSign from "~/lib/hook";
import { PLATFROM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";

const SingleBountyPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: Owner } = api.bounty.Bounty.isOwnerOfBounty.useQuery({
    BountyId: Number(id),
  });

  return <>{Owner?.isOwner ? <AdminBountyPage /> : <UserBountyPage />}</>;
};

export default SingleBountyPage;

const UserBountyPage = () => {
  const { onOpen } = useModal();
  const router = useRouter();
  const { id } = router.query;
  console.log(id);
  const utils = api.useUtils();
  const { data } = api.bounty.Bounty.getBountyByID.useQuery({
    BountyId: Number(id),
  });
  const { data: totalComment } = api.bounty.Bounty.getBountyComments.useQuery({
    bountyId: Number(id),
  });
  const { data: submissionData } =
    api.bounty.Bounty.getBountyAttachmentByUserId.useQuery({
      BountyId: Number(id),
    });

  const bountyComment = api.bounty.Bounty.getBountyComments.useQuery({
    bountyId: Number(id),
  });

  const DeleteSubmissionMutation =
    api.bounty.Bounty.deleteBountySubmission.useMutation({
      onSuccess: async () => {
        toast.success("Submission Deleted");
        await utils.bounty.Bounty.getBountyAttachmentByUserId.refetch();
      },
    });
  const handleSubmissionDelete = (id: number) => {
    DeleteSubmissionMutation.mutate({
      submissionId: id,
    });
  };

  if (data)
    return (
      <main className="  bg-white py-2 dark:bg-gray-900 md:px-40 md:py-4">
        <div className=" flex justify-between px-4 ">
          <article className=" mx-auto w-full ">
            <header className=" mb-4 lg:mb-6">
              <div className="flex items-center justify-between ">
                <address className="mb-6 flex items-center not-italic">
                  <Link href={`/fans/creator/${data?.creator.id}`}>
                    <div className="mr-3 inline-flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                      <Avater
                        className="h-12 w-12"
                        url={data?.creator.profileUrl}
                      />
                      <div>
                        <div
                          rel="author"
                          className="text-xl font-bold text-gray-900 dark:text-white"
                        >
                          {data?.creator.name}
                        </div>
                        <p className="text-base text-gray-500 dark:text-gray-400">
                          Posted On{" "}
                          {format(new Date(data?.createdAt), "MMMM dd, yyyy")}
                        </p>
                        {data.status === "PENDING" ? (
                          <div className="relative grid select-none items-center whitespace-nowrap rounded-md bg-indigo-500/20 px-2 py-1 font-sans text-xs font-bold uppercase text-indigo-900">
                            <span className="">Status: {data.status}</span>
                          </div>
                        ) : data.status === "APPROVED" ? (
                          <div className="relative grid select-none items-center whitespace-nowrap rounded-md bg-green-500/20 px-2 py-1 font-sans text-xs font-bold uppercase text-green-900">
                            <span className="">Status: {data.status}</span>
                          </div>
                        ) : (
                          <div className="relative grid select-none items-center whitespace-nowrap rounded-md bg-red-500/20 px-2 py-1 font-sans text-xs font-bold uppercase text-red-900">
                            <span className="">Status: {data.status}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </address>
              </div>

              <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white  lg:text-4xl">
                {data?.title}
              </h1>
            </header>
            <div>
              <Preview value={data?.description} />

              <div className="flex flex-col items-center  justify-center gap-4">
                {data.imageUrls.map((url) => (
                  <Image
                    key={url}
                    src={url}
                    alt="bounty image"
                    width={1000}
                    height={1000}
                    className="h-full w-full "
                  />
                ))}
              </div>
              <h1 className="mb-4 text-2xl font-extrabold text-gray-900 dark:text-white ">
                Price in USD : ${data?.priceInUSD}
              </h1>
              <h1 className="mb-4 text-2xl font-extrabold text-gray-900 dark:text-white ">
                Price in {PLATFROM_ASSET.code} : {data?.priceInBand}
              </h1>
            </div>
          </article>
        </div>

        <div className="mb-6 mt-2  flex flex-col gap-4   rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <h1 className="text-center text-2xl font-extrabold text-gray-900 dark:text-white">
              Your Recent Submissions
            </h1>
            <div className="flex items-center justify-center ">
              <Button
                className=""
                onClick={() =>
                  onOpen("upload file", {
                    bountyId: data.id,
                  })
                }
              >
                <UploadCloud className="mr-2" /> Attach Your Submission
              </Button>
            </div>
          </div>
          {submissionData?.length === 0 && (
            <p className="w-full text-center">There is no submission yet</p>
          )}
          {submissionData?.map((submission, id) => (
            <div key={id}>
              <div className="mb-6 flex flex-col gap-4   rounded-lg bg-white p-6 shadow-md ">
                <div className=" flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <p className="  ">{submission.content}</p>
                  </div>
                  <p className=" text-xs text-gray-700">
                    {format(new Date(submission.createdAt), "MMMM dd, yyyy")}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    className="  "
                    onClick={() =>
                      onOpen("view attachment", {
                        attachment: submission.attachmentUrl,
                      })
                    }
                    variant="outline"
                  >
                    <Paperclip size={16} className="mr-2" /> View Attachment
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleSubmissionDelete(submission.id)}
                  >
                    <Trash />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="ml-4 mt-2 text-lg font-bold text-gray-900 dark:text-white lg:text-2xl">
            Discussion ({totalComment?.length})
          </h2>
        </div>
        <AddBountyComment bountyId={Number(id)} />
        {bountyComment.data && bountyComment.data.length > 0 && (
          <div className="mb-10 px-4">
            <div className=" flex flex-col gap-4 rounded-lg border-2 border-base-200 ">
              <div className=" mt-1 flex flex-col gap-4  rounded-lg p-2">
                {bountyComment.data?.map((comment) => (
                  <>
                    <ViewBountyComment
                      key={comment.id}
                      comment={comment}
                      bountyChildComments={comment.bountyChildComments}
                    />
                    <Separator />
                  </>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    );
};

const AdminBountyPage = () => {
  const { onOpen } = useModal();
  const router = useRouter();
  const { needSign } = useNeedSign();
  const { id } = router.query;
  console.log(id);
  const { data } = api.bounty.Bounty.getBountyByID.useQuery({
    BountyId: Number(id),
  });
  const { data: totalComment } = api.bounty.Bounty.getBountyComments.useQuery({
    bountyId: Number(id),
  });

  const DeleteMutation = api.bounty.Bounty.deleteBounty.useMutation({
    onSuccess: async () => {
      await router.push("/fans/creator/bounty");

      toast.success("Bounty Deleted");
    },
  });

  const { data: allSubmission } =
    api.bounty.Bounty.getBountyAllSubmission.useQuery({
      BountyId: Number(id),
    });

  const bountyComment = api.bounty.Bounty.getBountyComments.useQuery({
    bountyId: Number(id),
  });

  const GetDeleteXDR = api.bounty.Bounty.getDeleteXdr.useMutation({
    onSuccess: async (data) => {
      if (data) {
        const res = await submitSignedXDRToServer4User(data);
        if (res) {
          DeleteMutation.mutate({
            BountyId: GetDeleteXDR.variables?.bountyId ?? 0,
          });
        }
      }
    },
  });

  const handleDelete = (id: number, price: number) => {
    GetDeleteXDR.mutate({ price: price, bountyId: id });
  };

  if (data)
    return (
      <>
        <main className="  bg-white py-2 dark:bg-gray-900 md:px-40 md:py-4">
          <div className=" flex justify-between px-4 ">
            <article className=" mx-auto w-full ">
              <header className=" mb-4 lg:mb-6">
                <div className="flex items-center justify-between ">
                  <address className="mb-6 flex items-center not-italic">
                    <div className="mr-3 inline-flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                      <Avater
                        className="h-12 w-12"
                        url={data?.creator.profileUrl}
                      />
                      <div>
                        <Link
                          href={`/fans/creator/${data?.creator.id}`}
                          rel="author"
                          className="text-xl font-bold text-gray-900 dark:text-white"
                        >
                          {data?.creator.name}
                        </Link>
                        <p className="text-base text-gray-500 dark:text-gray-400">
                          Posted On{" "}
                          {format(new Date(data?.createdAt), "MMMM dd, yyyy")}
                        </p>
                        <p>
                          {data.status === "PENDING" ? (
                            <div className="relative grid select-none items-center whitespace-nowrap rounded-md bg-indigo-500/20 px-2 py-1 font-sans text-xs font-bold uppercase text-indigo-900">
                              <span className="">Status: {data.status}</span>
                            </div>
                          ) : data.status === "APPROVED" ? (
                            <div className="relative grid select-none items-center whitespace-nowrap rounded-md bg-green-500/20 px-2 py-1 font-sans text-xs font-bold uppercase text-green-900">
                              <span className="">Status: {data.status}</span>
                            </div>
                          ) : (
                            <div className="relative grid select-none items-center whitespace-nowrap rounded-md bg-red-500/20 px-2 py-1 font-sans text-xs font-bold uppercase text-red-900">
                              <span className="">Status: {data.status}</span>
                            </div>
                          )}
                        </p>
                      </div>
                    </div>
                  </address>
                  <div>
                    <div className="flex flex-col gap-2">
                      {" "}
                      <Button
                        onClick={() =>
                          onOpen("edit bounty", { bountyId: data.id })
                        }
                      >
                        <Edit className="mr-2" size={16} /> Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(data.id, data.priceInBand)}
                        variant="destructive"
                      >
                        <Trash size={16} className="mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>

                <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white  lg:text-4xl">
                  {data?.title}
                </h1>
              </header>
              <div>
                <Preview value={data?.description} />

                <div className="flex flex-col items-center  justify-center gap-4">
                  {data.imageUrls.map((url) => (
                    <Image
                      key={url}
                      src={url}
                      alt="bounty image"
                      width={1000}
                      height={1000}
                      className="h-full w-full "
                    />
                  ))}
                </div>
                <h1 className="mb-4 text-2xl font-extrabold text-gray-900 dark:text-white ">
                  Price in USD : ${data?.priceInUSD}
                </h1>
                <h1 className="mb-4 text-2xl font-extrabold text-gray-900 dark:text-white ">
                  Price in {PLATFROM_ASSET.code} : {data?.priceInBand}
                </h1>
              </div>
            </article>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <h2 className="ml-4 mt-2 text-lg font-bold text-gray-900 dark:text-white lg:text-2xl">
              Discussion ({totalComment?.length})
            </h2>
          </div>
          <AddBountyComment bountyId={Number(id)} />
          {bountyComment.data && bountyComment.data.length > 0 && (
            <div className="mb-10 px-4">
              <div className=" flex flex-col gap-4 rounded-lg border-2 border-base-200 ">
                <div className=" mt-1 flex flex-col gap-4  rounded-lg p-2">
                  {bountyComment.data?.map((comment) => (
                    <>
                      <ViewBountyComment
                        key={comment.id}
                        comment={comment}
                        bountyChildComments={comment.bountyChildComments}
                      />
                      <Separator />
                    </>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 p-2">
            <h1 className="mt-4 text-center text-3xl font-extrabold text-gray-900 dark:text-white  lg:text-4xl">
              Recent Submissions
            </h1>
            {allSubmission?.length === 0 && (
              <p className="mb-6 mt-2  flex flex-col gap-4 rounded-lg  bg-white p-6 text-center shadow-md">
                There is no submission yet
              </p>
            )}
            {allSubmission?.map((submission, id) => (
              <div key={id}>
                <div className="mb-6 flex flex-col gap-4   rounded-lg bg-white p-6 shadow-md ">
                  <div className="flex items-center">
                    <Avater className="h-12 w-12" url={submission.user.image} />
                    <div className="ml-2">
                      <div className="text-sm ">
                        <span className="font-semibold">
                          {submission.user.name}
                        </span>
                        <span className="text-gray-500"> • 1st</span>
                      </div>
                      <div className="text-xs text-gray-500 ">
                        {format(
                          new Date(submission.createdAt),
                          "MMMM dd, yyyy",
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 text-sm leading-normal text-gray-800 md:leading-relaxed">
                    {submission.content}
                  </p>

                  <div>
                    <Button
                      className="  "
                      variant="outline"
                      onClick={() =>
                        onOpen("view attachment", {
                          attachment: submission.attachmentUrl,
                        })
                      }
                    >
                      <Paperclip size={16} className="mr-2" /> View Attachment
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </>
    );
};
