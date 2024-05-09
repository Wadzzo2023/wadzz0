import React from "react";
import { api } from "~/utils/api";

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
              <th>PUBKEY</th>
              <th>Created At</th>
            </tr>
            {admins.data.map((admin, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{admin.id}</td>
                <td>{admin.joinedAt.getFullYear()}</td>
              </tr>
            ))}
          </thead>
          <tbody></tbody>
        </table>
      </div>
    );
}
