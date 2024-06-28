import React from "react";
import { match } from "ts-pattern";
import { api } from "~/utils/api";
import { error, empty, loading, success } from "~/utils/trcp/patterns";

export default function ClaimPage() {
  const pins = api.maps.pin.getConsumedLocated.useQuery();

  if (pins.isLoading) return <p>Loading..</p>;
  if (pins.error) return <p>Error</p>;

  return (
    <div>
      Claim
      {/* {pins.data?.map((pin) => <p key={pin.}>{pin.id}</p>)} */}
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
              {pins.data.map((pin, i) => {
                return (
                  <tr key={pin.id}>
                    <th>{i + 1}</th>
                    <td>{pin.id}</td>
                    <td>{pin.userId}</td>
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
    </div>
  );
}
