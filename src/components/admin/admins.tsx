import React from "react";
import { api } from "~/utils/api";
import { Button } from "../shadcn/ui/button";
import toast from "react-hot-toast";
import { addrShort } from "~/utils/utils";

export default function AdminsList() {
  const admins = api.wallate.admin.admins.useQuery();
  if (admins.isLoading) return <div>Loading...</div>;
  if (admins.data)
    return (
      <div className="my-4 overflow-x-auto rounded-lg bg-base-200 p-4">
        <table className="table">
          {/* head */}
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Pubkey</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
            {admins.data.map((admin, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{admin.name}</td>
                <td>{addrShort(admin.id, 10)}</td>
                <td>{admin.joinedAt.getFullYear()}</td>
                <td>
                  <DeleteAdminButton admin={admin.id} />
                </td>
              </tr>
            ))}
          </thead>
          <tbody></tbody>
        </table>
      </div>
    );
}

function DeleteAdminButton({ admin }: { admin: string }) {
  const deleteAdmin = api.wallate.admin.deleteAdmin.useMutation({
    onSuccess: () => toast.success("Admin deleted"),
  });
  return (
    <Button
      onClick={() => {
        deleteAdmin.mutate(admin);
      }}
    >
      {deleteAdmin.isLoading && (
        <span className="loading loading-spinner"></span>
      )}
      Delete
    </Button>
  );
}
