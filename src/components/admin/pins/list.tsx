"use client"

import type { ItemPrivacy, Location, LocationGroup } from "@prisma/client"
import { Check, ChevronDown, ChevronUp, Edit, Trash2, X } from "lucide-react"
import Image from "next/image"
import React, { type ReactNode, useState } from "react"
import toast from "react-hot-toast"
import { Button } from "~/components/shadcn/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/shadcn/ui/collapsible"
import { api } from "~/utils/api"
import { CREATOR_TERM } from "~/utils/term"
import { PinInfoUpdateModal } from "./edit-pin"


interface pinData {
  image: string
  title: string
  description: string
  id: string
  startDate?: Date
  endDate?: Date
  collectionLimit?: number
  remainingLimit?: number
  multiPin?: boolean
  autoCollect?: boolean
  lat?: number
  long?: number
  link?: string

}
// Replace the entire Pins component with this implementation
export default function Pins() {
  const [viewMode, setViewMode] = useState<"pending" | "approved">("pending")

  // Separate queries for pending and approved pins
  const pendingLocationGroups = api.maps.pin.getLocationGroups.useQuery(undefined, {
    enabled: viewMode === "pending",
  })

  const approvedLocationGroups = api.maps.pin.getApprovedLocationGroups.useQuery(undefined, {
    enabled: viewMode === "approved",
  })

  // Determine which data to use based on current view mode
  const locationGroups = viewMode === "pending" ? pendingLocationGroups : approvedLocationGroups

  if (locationGroups.isLoading) return <div>Loading...</div>
  if (locationGroups.error) return <div>Error: {locationGroups.error.message}</div>

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-4 w-full">
      <div className="mb-4 flex items-center gap-2">
        <Button variant={viewMode === "pending" ? "default" : "outline"} onClick={() => setViewMode("pending")}>
          Pending Pins
        </Button>
        <Button variant={viewMode === "approved" ? "default" : "outline"} onClick={() => setViewMode("approved")}>
          Approved Pins
        </Button>
      </div>

      {locationGroups.data && (
        <GroupPins groups={locationGroups.data} mode={viewMode} refetch={locationGroups.refetch} />
      )}
    </div>
  )
}

type GroupPins = LocationGroup & {
  locations: Location[]
  creator: { name: string; id: string }
}

type Group = Record<string, GroupPins[]>

// Update the GroupPins component to accept mode and refetch props
function GroupPins({
  groups,
  mode,
  refetch,
}: {
  groups: GroupPins[]
  mode: "pending" | "approved"
  refetch: () => void
}) {
  const groupByCreator: Record<string, GroupPins[]> = {}

  groups.forEach((group) => {
    const creatorId = group.creator.id
    const creatorName = group.creator.name

    if (!groupByCreator[creatorId]) {
      groupByCreator[creatorId] = []
    }

    groupByCreator[creatorId].push(group)
  })

  return (
    <div className=" w-full">
      <h2 className="text-lg font-bold">{mode === "approved" ? "Approved" : "Pending"} Pins</h2>
      <PinsList groupsByCreator={groupByCreator} mode={mode} refetch={refetch} />
    </div>
  )
}

// Update the PinsList component to handle different modes
function PinsList({
  groupsByCreator,
  mode,
  refetch,
}: {
  groupsByCreator: Record<string, GroupPins[]>
  mode: "pending" | "approved"
  refetch: () => void
}) {
  const [selectedGroup, setSelectedGroup] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pinData, setPinData] = useState<pinData | undefined>(undefined)
  const approveM = api.maps.pin.approveLocationGroups.useMutation({
    onSuccess: (data, variable) => {
      if (variable.approved) toast.success("Pins Approved Successfully!")
      if (!variable.approved) toast.error("Pins Rejected Successfully!")
      setSelectedGroup([])
      refetch()
    },
    onError: (error) => {
      toast.error("Operation failed: " + error.message)
    },
  })

  const deleteGroupM = api.maps.pin.deleteLocationGroup.useMutation({
    onSuccess: () => {
      toast.success("Pin group deleted successfully!")
      refetch()
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message)
    },
  })

  const deletePinM = api.maps.pin.deletePin.useMutation({
    onSuccess: () => {
      toast.success("Pin deleted successfully!")
      refetch()
    },
    onError: (error) => {
      toast.error("Failed to delete pin: " + error.message)
    },
  })

  function handleGroupSelection(groupId: string) {
    setSelectedGroup((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId)
      } else {
        return [...prev, groupId]
      }
    })
  }

  function handleDeletePin(pinId: string) {

    deletePinM.mutate({ id: pinId })

  }

  function handleDeleteGroup(groupId: string) {

    deleteGroupM.mutate({ id: groupId })

  }

  return (
    <div className="min-w-2xl p-2 space-y-4">
      {/* Creator level collapsibles */}
      {Object.entries(groupsByCreator).map(([creatorId, creatorGroups]) => {
        // Get creator name from the first group
        const creatorName = creatorGroups[0]?.creator.name ?? "Unknown Creator"

        // Group pins by location group ID within this creator
        const groupPins: Group = {}
        creatorGroups.forEach((group) => {
          const locationGroupId = group.id
          if (groupPins[locationGroupId]) {
            groupPins[locationGroupId].push(group)
          } else {
            groupPins[locationGroupId] = [group]
          }
        })

        return (
          <CollapsibleDemo
            key={`creator-${creatorId}`}
            header={
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {CREATOR_TERM}: {creatorName}
                </span>
              </div>
            }
            content={
              <div className="space-y-2 pl-4">
                {Object.entries(groupPins).map(([key, pins]) => (
                  <CollapsibleDemo
                    key={key}
                    header={
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center  gap-2">
                          {mode === "pending" && (
                            <label>
                              <input
                                type="checkbox"
                                className="checkbox"
                                checked={selectedGroup.includes(key)}
                                onChange={() => handleGroupSelection(key)}
                              />
                            </label>
                          )}

                          <div className="flex flex-col">
                            <span>Title: {pins[0]?.title}</span>
                            <span>Description: {pins[0]?.description}</span>
                          </div>
                        </div>
                        {mode === "approved" && (
                          <div className="flex gap-2">

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteGroup(key)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    }
                    content={
                      <table className="table table-zebra ml-5 w-full">
                        <thead>
                          <tr>
                            <th>Image</th>
                            <th>ID</th>
                            <th>Latitude | Longitude</th>


                            {mode === "approved" && <th>Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {pins.map((pin) => (
                            pin.locations.map((location) => (
                              <tr key={location.id}>
                                <td>

                                  <Image alt="pin image" width={50} height={50} src={pin.image ?? "https://app.wadzzo.com/images/loading.png"}
                                    className="h-8 w-8 object-cover"
                                  />

                                </td>
                                <th>{location.id}</th>
                                <td>{location.latitude} | {location.longitude}</td>


                                {mode === "approved" && (
                                  <td>
                                    <div className="flex gap-2">

                                      <Button variant="ghost" size="sm" onClick={() => handleDeletePin(location.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            )
                            ))
                          )}
                        </tbody>
                      </table>
                    }
                  />
                ))}
              </div>
            }
          />
        )
      })}

      {mode === "pending" && (
        <div className="flex w-full py-4">
          <div className="flex w-full items-end justify-end gap-4">
            <button
              className="btn btn-primary"
              onClick={() => {
                approveM.mutate({
                  locationGroupIds: selectedGroup,
                  approved: true,
                })
                toast("Selected Groups: " + selectedGroup.join(", "))
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
      )}
      {
        pinData && (
          <PinInfoUpdateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} pinData={pinData} />
        )
      }
    </div>
  )
}

export function CollapsibleDemo({
  content,
  header,
}: {
  header: ReactNode
  content: ReactNode
}) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full space-y-2 border rounded-md p-2">
      <div className="flex items-center justify-between space-x-4 px-4">
        <h4 className="text-sm font-semibold flex-1">{header}</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isOpen ? <ChevronUp /> : <ChevronDown />}
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">{content}</CollapsibleContent>
    </Collapsible>
  )
}

