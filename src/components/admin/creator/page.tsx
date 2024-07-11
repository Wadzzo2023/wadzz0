import React from "react";
import toast from "react-hot-toast";
import { Button } from "~/components/shadcn/ui/button";
import { api } from "~/utils/api";
import PostDeleteComponent from "../post";

export default function CreatorPage() {
  return (
    <div>
      <h2 className="text-lg font-bold">Creators</h2>
      <Creators />
      <PostDeleteComponent />
    </div>
  );
}

function Creators() {
  const creators = api.admin.creator.getCreators.useQuery();
  if (creators.isLoading) return <div>Loading...</div>;
  if (creators.error) return <div>Error</div>;

  return (
    <div>
      <div className="overflow-x-auto bg-base-100">
        <table className="table table-zebra">
          {/* head */}
          <thead>
            <tr>
              <th></th>
              <th>Pubkey</th>
              <th>Jointed At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {creators.data?.map((creator, i) => {
              return (
                <tr key={creator.id}>
                  <th>{i + 1}</th>
                  <td>{creator.id}</td>
                  <td>{creator.joinedAt.toLocaleDateString()}</td>
                  <td>
                    <ActionButton
                      creatorId={creator.id}
                      status={creator.approved}
                    />
                  </td>
                  <td>
                    <DeleteCreatorButton creatorId={creator.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionButton({
  status,
  creatorId,
}: {
  status: boolean | null;
  creatorId: string;
}) {
  const actionM = api.admin.creator.creatorAction.useMutation();

  function handleClick(action: boolean | null) {
    actionM.mutate({ creatorId: creatorId, status: action });
  }
  if (status === null)
    return (
      <button
        className="btn btn-success btn-sm"
        onClick={() => handleClick(true)}
      >
        Approve
      </button>
    );
  if (status === false)
    return (
      <button
        className="btn btn-primary btn-sm"
        onClick={() => handleClick(true)}
      >
        Unban
      </button>
    );
  if (status === true)
    return (
      <button
        className="btn btn-error btn-sm"
        onClick={() => handleClick(false)}
      >
        Ban
      </button>
    );
}

function DeleteCreatorButton({ creatorId }: { creatorId: string }) {
  const deleteCreator = api.admin.creator.deleteCreator.useMutation({
    onSuccess: () => {
      return toast.success("Creator deleted");
    },
  });
  return (
    <Button
      onClick={() => {
        deleteCreator.mutate(creatorId);
      }}
    >
      {deleteCreator.isLoading && (
        <span className="loading loading-spinner"></span>
      )}
      Delete
    </Button>
  );
}
