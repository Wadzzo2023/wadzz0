import React from "react";
import { api } from "~/utils/api";

export default function UserList() {
  const users = api.admin.user.getUsers.useQuery();

  if (users.isLoading) return <p>Loading ..</p>;
  if (users.isError) return <p>Error</p>;

  return (
    <div>
      <div className="overflow-x-auto">
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
                    {/* <ActionButton
                      creatorId={u.id}
                      status={u.approved}
                    /> */}
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
