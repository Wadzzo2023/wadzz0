import { Location, LocationGroup } from "@prisma/client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { api } from "~/utils/api";
import { Check, X } from "lucide-react";

export default function PinsList() {
  const [selectedPins, setSelectedPin] = useState<number[]>([]);
  const pins = api.maps.pin.getPins.useQuery();
  const aproveM = api.maps.pin.approvePins.useMutation({
    onSuccess: (data, variable) => {
      if (variable.approved) toast.success("Pins Approved Successfully!");
      if (!variable.approved) toast.error("Pins Rejected Successfully!");
      setSelectedPin([]);
    },
    onError: (error) => {
      toast.error("Operation failed: " + error.message);
    },
  });

  function handlePinSelection(pinId: number): void {
    setSelectedPin((prev) => {
      if (prev.includes(pinId)) {
        return prev.filter((id) => id !== pinId);
      } else {
        return [...prev, pinId];
      }
    });
  }

  if (pins.isLoading) return <div>Loading...</div>;
  if (pins.error) return <div>Error: {pins.error.message}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>
              {/* <label>
                    <input
                      type="checkbox"
                      className="checkbox"
                      onChange={handleClickChange}
                    />
                  </label> */}
            </th>
            <th></th>
            <th>Name</th>
            <th>Job</th>
            <th>Favorite Color</th>
          </tr>
        </thead>
        <tbody>
          {pins.data.map((pin) => (
            <tr key={pin.id}>
              <th>
                <label>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selectedPins.includes(pin.id)}
                    onChange={(e) => handlePinSelection(pin.id)}
                  />
                </label>
              </th>
              <th>{pin.id}</th>
              <td>{pin.title}</td>
              <td>{pin.creatorId}</td>
              <td>{pin.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex w-full py-4">
        <div className="flex w-full items-end justify-end gap-4">
          <button
            className="btn btn-primary"
            onClick={() => {
              aproveM.mutate({ pins: selectedPins, approved: true });
              toast("Selected Pins: " + selectedPins.join(", "));
            }}
            disabled={selectedPins.length === 0 || aproveM.isLoading}
          >
            <Check />
            Approve
          </button>
          <button
            onClick={() =>
              aproveM.mutate({ pins: selectedPins, approved: false })
            }
            className="btn btn-error"
            disabled={selectedPins.length === 0 || aproveM.isLoading}
          >
            <X />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function Group() {
  return (
    <table className="table table-zebra">
      <thead>
        <tr>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {/* {pinsGroup.data.map((pinGroup) => (
          <AccordionList
            pins={pinGroup.locations}
            group={pinGroup}
            handlePinSelection={handlePinSelection}
            selectedPins={selectedPins}
          />
        ))} */}
      </tbody>
    </table>
  );
}

function AccordionList({
  pins,
  group,
  selectedPins,
  handlePinSelection,
}: {
  pins: Location[];
  group: LocationGroup;
  selectedPins: number[];
  handlePinSelection: (pinId: number) => void;
}) {
  function handleClickChange(
    event: React.ChangeEvent<HTMLInputElement>,
    pinId: number,
  ): void {
    handlePinSelection(pinId);
    // toast(
    //   event.currentTarget.checked ? "checked" + pinId : "unchecked" + pinId,
    // );
  }

  return (
    <details className="collapse bg-base-200">
      <summary className="collapse-title text-xl font-medium">
        <div>Group {group.id}</div>
      </summary>
      <div className="collapse-content">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            {/* head */}
            <thead>
              <tr>
                <th>
                  {/* <label>
                    <input
                      type="checkbox"
                      className="checkbox"
                      onChange={handleClickChange}
                    />
                  </label> */}
                </th>
                <th></th>
                <th>Name</th>
                <th>Brand</th>
                <th>Pin Description</th>
              </tr>
            </thead>
            <tbody>
              {pins.map((pin) => (
                <tr key={pin.id}>
                  <th>
                    <label>
                      <input
                        type="checkbox"
                        className="checkbox"
                        onChange={(e) => handleClickChange(e, pin.id)}
                      />
                    </label>
                  </th>
                  <th>{pin.id}</th>
                  <td>{pin.title}</td>
                  <td>{pin.creatorId}</td>
                  <td>{pin.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
