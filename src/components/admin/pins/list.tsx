import { Location, LocationGroup } from "@prisma/client";
import React, { ReactNode, useState } from "react";
import toast from "react-hot-toast";
import { api } from "~/utils/api";
import { ArrowDown, Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { CREATOR_TERM } from "~/utils/term";
import { Button } from "~/components/shadcn/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/shadcn/ui/collapsible";
import { addrShort } from "~/utils/utils";
import Image from "next/image";
import { LocationType } from "~/types/pin";

export default function Pins() {
  const pins = api.maps.pin.getPins.useQuery();

  if (pins.isLoading) return <div>Loading...</div>;
  if (pins.error) return <div>Error: {pins.error.message}</div>;

  if (pins.data) {
    return <GroupPins pins={pins.data} />;
  }
}

type Group = Record<string, LocationType[]>;

function GroupPins({ pins }: { pins: LocationType[] }) {
  const groups: Group = {};

  const groupPins = pins.map((pin) => {
    const locationGroupId = pin.locationGroupId;
    if (locationGroupId) {
      if (groups[locationGroupId]) {
        groups[locationGroupId].push(pin);
      } else {
        groups[locationGroupId] = [pin];
      }
    }
  });
  return (
    <div className="min-w-3xl">
      <h2 className="text-lg font-bold">Pins</h2>
      <PinsList groups={groups} />
    </div>
  );
}

function PinsList({ groups }: { groups: Group }) {
  const [selectedPins, setSelectedPin] = useState<number[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

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

  function handleClickChange(
    event: React.ChangeEvent<HTMLInputElement>,
    pinId: number,
  ): void {
    handlePinSelection(pinId);
  }

  function handleGroupSelection(groupId: string) {
    const groupPins = groups[groupId];
    if (groupPins) {
      const groupPinsIds = groupPins.map((pin) => pin.id);
      // if all pins are selected, then deselect all
      if (
        groupPinsIds.every((pinId) => selectedPins.includes(pinId)) &&
        selectedPins.length > 0
      ) {
        setSelectedPin((prev) =>
          prev.filter((id) => !groupPinsIds.includes(id)),
        );
      } else {
        setSelectedPin((prev) => [...prev, ...groupPinsIds]);
      }
    }
  }

  return (
    <div className=" w-3xl  p-2">
      {Object.entries(groups).map(([key, pins]) => {
        return (
          <CollapsibleDemo
            key={key}
            header={
              <div className="flex items-center gap-2">
                <label>
                  <input
                    type="checkbox"
                    className="checkbox"
                    onChange={(e) => handleGroupSelection(key)}
                  />
                </label>
                Pin Groups {key} {}
              </div>
            }
            content={
              <table className="table table-zebra ml-5">
                <thead>
                  <tr>
                    <th></th>
                    <th>ID</th>
                    <th>title</th>
                    <th>Image</th>
                    <th>Creator Name</th>
                    <th>Description</th>
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
                            checked={selectedPins.includes(pin.id)}
                            onChange={(e) => handlePinSelection(pin.id)}
                          />
                        </label>
                      </th>
                      <th>{pin.id}</th>
                      <td>{pin.title}</td>
                      <td>
                        {pin.image && (
                          <Image
                            alt="pin image"
                            width={50}
                            height={50}
                            src={pin.image}
                          />
                        )}
                      </td>
                      <td>{pin.creator.name}</td>
                      <td>{pin.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />

          // <div className="collapse bg-base-200">
          //   <input type="checkbox" />
          //   <label>
          //     <input
          //       type="checkbox"
          //       className="checkbox"
          //       // checked={selectedPins.includes(pin.id)}
          //       // onChange={(e) => handlePinSelection(pin.id)}
          //     />
          //   </label>
          //   <div className="collapse-title text-xl font-medium">

          //   </div>

          // </div>
        );
      })}

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
            Aprove
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

export function CollapsibleDemo({
  content,
  header,
}: {
  header: ReactNode;
  content: ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="min-w-lg space-y-2"
    >
      <div className="flex items-center justify-between space-x-4 px-4">
        <h4 className="text-sm font-semibold">
          {/* @peduarte starred 3 repositories */}
          {header}
        </h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isOpen ? <ChevronUp /> : <ChevronDown />}
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        {content}
        {/* <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
          @radix-ui/colors
        </div>
        <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
          @stitches/react
        </div> */}
      </CollapsibleContent>
    </Collapsible>
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
                <th>{CREATOR_TERM}</th>
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
