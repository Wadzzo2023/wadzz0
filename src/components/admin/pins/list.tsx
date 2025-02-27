"use client"

import type { Location, LocationGroup } from "@prisma/client"
import { Check, ChevronDown, ChevronUp, X } from "lucide-react"
import Image from "next/image"
import React, { type ReactNode, useState } from "react"
import toast from "react-hot-toast"
import { Button } from "~/components/shadcn/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/shadcn/ui/collapsible"
import { api } from "~/utils/api"
import { CREATOR_TERM } from "~/utils/term"

export default function Pins() {
  const locationGroups = api.maps.pin.getLocationGroups.useQuery()

  if (locationGroups.isLoading) return <div>Loading...</div>
  if (locationGroups.error) return <div>Error: {locationGroups.error.message}</div>

  if (locationGroups.data) {
    return <GroupPins groups={locationGroups.data} />
  }
}

type GroupPins = LocationGroup & {
  locations: Location[]
  creator: { name: string; id: string }
}

type Group = Record<string, GroupPins[]>

function GroupPins({ groups }: { groups: GroupPins[] }) {
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
    <div className="max-w-5xl">
      <h2 className="text-lg font-bold">Pins</h2>
      <PinsList groupsByCreator={groupByCreator} />
    </div>
  )
}

function PinsList({ groupsByCreator }: { groupsByCreator: Record<string, GroupPins[]> }) {
  const [selectedGroup, setSelectedGroup] = useState<string[]>([])

  const approveM = api.maps.pin.approveLocationGroups.useMutation({
    onSuccess: (data, variable) => {
      if (variable.approved) toast.success("Pins Approved Successfully!")
      if (!variable.approved) toast.error("Pins Rejected Successfully!")
      setSelectedGroup([])
    },
    onError: (error) => {
      toast.error("Operation failed: " + error.message)
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
                      <div className="flex items-center gap-2">
                        <label>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedGroup.includes(key)}
                            onChange={() => handleGroupSelection(key)}
                          />
                        </label>
                        <span>Pin Group {key}</span>
                      </div>
                    }
                    content={
                      <table className="table table-zebra ml-5 w-full">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Image</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pins.map((pin) => (
                            <tr key={pin.id}>
                              <th>{pin.id}</th>
                              <td>{pin.title}</td>
                              <td>
                                {pin.image && (
                                  <Image alt="pin image" width={50} height={50} src={pin.image || "/placeholder.svg"} />
                                )}
                              </td>
                              <td>{pin.description}</td>
                            </tr>
                          ))}
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

