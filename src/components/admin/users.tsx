import React from "react";
import toast from "react-hot-toast";
import { api } from "~/utils/api";
import { Button } from "../shadcn/ui/button";

export default function UserList() {
  const users = api.admin.user.getUsers.useQuery();

  if (users.isLoading) return <p>Loading ..</p>;
  if (users.isError) return <p>Error</p>;

  return (
    <div>
      <div className="overflow-x-auto bg-base-100">
        <table className="table table-zebra">
          {/* head */}
          <thead>
            <tr>
              <th></th>
              <th>Pubkey</th>
              <th>Joined At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.data.map((u, i) => {
              return (
                <tr key={u.id}>
                  <th>{i + 1}</th>
                  <td>{u.id}</td>
                  <td>{u.bio}</td>
                  <td>
                    <DeleteUserButton user={u.id} />
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

function DeleteUserButton({ user }: { user: string }) {
  const deleteUser = api.admin.user.deleteUser.useMutation({
    onSuccess: () => toast.success("User deleted"),
  });
  return (
    <Button
      onClick={() => {
        deleteUser.mutate(user);
      }}
    >
      {deleteUser.isLoading && (
        <span className="loading loading-spinner"></span>
      )}
      Delete
    </Button>
  );
}
