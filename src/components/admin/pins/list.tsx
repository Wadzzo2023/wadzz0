import { Location, LocationGroup } from "@prisma/client";
import { set } from "date-fns";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import Image from "next/image";
import React, { ReactNode, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "~/components/shadcn/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/shadcn/ui/collapsible";
import { LocationType } from "~/types/pin";
import { api } from "~/utils/api";
import { CREATOR_TERM } from "~/utils/term";

export default function Pins() {
  const locationGroups = api.maps.pin.getLocationGroups.useQuery();

  if (locationGroups.isLoading) return <div>Loading...</div>;
  if (locationGroups.error)
    return <div>Error: {locationGroups.error.message}</div>;

  if (locationGroups.data) {
    return <GroupPins groups={locationGroups.data} />;
  }
}

type GroupPins = LocationGroup & {
  locations: Location[];
  creator: { name: string };
};

type Group = Record<string, GroupPins[]>;

function GroupPins({ groups }: { groups: GroupPins[] }) {
  const groupPins: Group = {};

  groups.forEach((group) => {
    const locationGroupId = group.id;
    if (groupPins[locationGroupId]) {
      groupPins[locationGroupId].push(group);
    } else {
      groupPins[locationGroupId] = [group];
    }
  });

  return (
    <div className="max-w-5xl">
      <h2 className="text-lg font-bold">Pins</h2>
      <PinsList groups={groupPins} />
    </div>
  );
}

function PinsList({ groups }: { groups: Group }) {
  // const [selectedPins, setSelectedPin] = useState<number[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string[]>([]);

  const approveM = api.maps.pin.approveLocationGroups.useMutation({
    onSuccess: (data, variable) => {
      if (variable.approved) toast.success("Pins Approved Successfully!");
      if (!variable.approved) toast.error("Pins Rejected Successfully!");
      setSelectedGroup([]);
    },
    onError: (error) => {
      toast.error("Operation failed: " + error.message);
    },
  });

  // function handlePinSelection(pinId: number): void {
  //   setSelectedPin((prev) => {
  //     if (prev.includes(pinId)) {
  //       return prev.filter((id) => id !== pinId);
  //     } else {
  //       return [...prev, pinId];
  //     }
  //   });
  // }

  // function handleClickChange(
  //   event: React.ChangeEvent<HTMLInputElement>,
  //   pinId: number,
  // ): void {
  //   handlePinSelection(pinId);
  // }

  function handleGroupSelection(groupId: string) {
    setSelectedGroup((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });

    // const groupPins = groups[groupId];
    // if (groupPins) {
    //   const groupPinsIds = groupPins.map((pin) => pin.id);
    //   // if all pins are selected, then deselect all
    //   if (
    //     groupPinsIds.every((pinId) => selectedPins.includes(pinId)) &&
    //     selectedPins.length > 0
    //   ) {
    //     setSelectedPin((prev) =>
    //       prev.filter((id) => !groupPinsIds.includes(id)),
    //     );
    //   } else {
    //     setSelectedPin((prev) => [...prev, ...groupPinsIds]);
    //   }
    // }
  }

  return (
    <div className="min-w-2xl   p-2">
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
                    {/* <th></th> */}
                    <th>ID</th>
                    <th>title</th>
                    <th>Image</th>
                    <th>{CREATOR_TERM} Name</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {pins.map((pin) => (
                    <tr key={pin.id}>
                      {/* <th>
                        <label>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedPins.includes(pin.id)}
                            onChange={(e) => handlePinSelection(pin.id)}
                          />
                        </label>
                      </th> */}
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
              approveM.mutate({
                locationGroupIds: selectedGroup,
                approved: true,
              });
              toast("Selected Groups: " + selectedGroup.join(", "));
            }}
            disabled={selectedGroup.length === 0 || approveM.isLoading}
          >
            <Check />
            Approve
          </button>
          <button
            onClick={() =>
              approveM.mutate({
                locationGroupIds: selectedGroup,
                approved: false,
              })
            }
            className="btn btn-error"
            disabled={selectedGroup.length === 0 || approveM.isLoading}
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

// function AccordionList({
//   pins,
//   group,
//   selectedPins,
//   handlePinSelection,
// }: {
//   pins: Location[];
//   group: LocationGroup;
//   selectedPins: number[];
//   handlePinSelection: (pinId: number) => void;
// }) {
//   function handleClickChange(
//     event: React.ChangeEvent<HTMLInputElement>,
//     pinId: number,
//   ): void {
//     handlePinSelection(pinId);
//     // toast(
//     //   event.currentTarget.checked ? "checked" + pinId : "unchecked" + pinId,
//     // );
//   }

//   return (
//     <details className="collapse bg-base-200">
//       <summary className="collapse-title text-xl font-medium">
//         <div>Group {group.id}</div>
//       </summary>
//       <div className="collapse-content">
//         <div className="overflow-x-auto">
//           <table className="table table-zebra">
//             {/* head */}
//             <thead>
//               <tr>
//                 <th>
//                   {/* <label>
//                     <input
//                       type="checkbox"
//                       className="checkbox"
//                       onChange={handleClickChange}
//                     />
//                   </label> */}
//                 </th>
//                 <th></th>
//                 <th>Name</th>
//                 <th>{CREATOR_TERM}</th>
//                 <th>Pin Description</th>
//               </tr>
//             </thead>
//             <tbody>
//               {pins.map((pin) => (
//                 <tr key={pin.id}>
//                   <th>
//                     <label>
//                       <input
//                         type="checkbox"
//                         className="checkbox"
//                         // onChange={(e) => handleClickChange(e, pin.id)}
//                       />
//                     </label>
//                   </th>
//                   <th>{pin.id}</th>
//                   <td>{pin.title}</td>
//                   <td>{pin.creatorId}</td>
//                   <td>{pin.description}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </details>
//   );
// }
