"use client"

import type { Location, LocationGroup } from "@prisma/client"
import { Check, ChevronDown, Trash2, X } from "lucide-react"
import Image from "next/image"
import { useState, useMemo } from "react"
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

function LoadingSkeleton() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="mb-6 border-b">
        <div className="flex">
          <div className="px-4 py-2 w-28 h-8 bg-gray-200 animate-pulse rounded"></div>
          <div className="px-4 py-2 w-28 h-8 bg-gray-200 animate-pulse rounded ml-2"></div>
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-md overflow-hidden mb-4">
          <div className="flex items-center justify-between bg-gray-50 p-3">
            <div className="h-5 w-40 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
          </div>
          <div className="p-3 space-y-3">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="border rounded overflow-hidden bg-white">
                <div className="flex items-center justify-between p-2 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-200 animate-pulse rounded"></div>
                    <div className="flex flex-col">
                      <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mb-1"></div>
                      <div className="h-3 w-40 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Pins() {
  const [viewMode, setViewMode] = useState<"pending" | "approved">("pending")

  const pendingLocationGroups = api.maps.pin.getLocationGroups.useQuery(undefined, {
    enabled: viewMode === "pending",
  })
  const approvedLocationGroups = api.maps.pin.getApprovedLocationGroups.useQuery(undefined, {
    enabled: viewMode === "approved",
  })

  const locationGroups = viewMode === "pending" ? pendingLocationGroups : approvedLocationGroups

  if (locationGroups.isLoading) return <LoadingSkeleton />
  if (locationGroups.error) return <div>Error: {locationGroups.error.message}</div>

  return (
    <div className="w-full p-4 space-y-4">
      <div className="mb-6 border-b">
        <div className="flex">
          <button
            onClick={() => setViewMode("pending")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${viewMode === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Pending Pins
          </button>
          <button
            onClick={() => setViewMode("approved")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${viewMode === "approved"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Approved Pins
          </button>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        {locationGroups.data && (
          <GroupPins groups={locationGroups.data} mode={viewMode} refetch={locationGroups.refetch} />
        )}
      </div>
    </div>
  )
}

type GroupPins = LocationGroup & {
  locations: Location[]
  creator: { name: string; id: string }
}

type Group = Record<string, GroupPins[]>

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
    if (!groupByCreator[creatorId]) groupByCreator[creatorId] = []
    groupByCreator[creatorId].push(group)
  })

  return (
    <div className="w-full">
      <h2 className="text-lg font-bold mb-4">{mode === "approved" ? "Approved" : "Pending"} Pins</h2>
      <div className="w-full overflow-hidden">
        <PinsList groupsByCreator={groupByCreator} mode={mode} refetch={refetch} />
      </div>
    </div>
  )
}

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

  // All group IDs across every creator
  const allGroupIds = useMemo(
    () => Object.values(groupsByCreator).flatMap((groups) => groups.map((g) => g.id)),
    [groupsByCreator],
  )

  const isAllSelected = allGroupIds.length > 0 && allGroupIds.every((id) => selectedGroup.includes(id))
  const isIndeterminate = !isAllSelected && selectedGroup.length > 0

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

  const deleteGroupM = api.maps.pin.deleteLocationGroupForAdmin.useMutation({
    onSuccess: () => {
      toast.success("Pin group deleted successfully!")
      refetch()
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message)
    },
  })

  const deletePinM = api.maps.pin.deletePinForAdmin.useMutation({
    onSuccess: () => {
      toast.success("Pin deleted successfully!")
      refetch()
    },
    onError: (error) => {
      toast.error("Failed to delete pin: " + error.message)
    },
  })

  // --- Selection helpers ---

  function handleSelectAll(checked: boolean) {
    setSelectedGroup(checked ? [...allGroupIds] : [])
  }

  function handleCreatorSelectAll(creatorId: string, checked: boolean) {
    const creatorGroupIds = groupsByCreator[creatorId]?.map((g) => g.id) ?? []
    setSelectedGroup((prev) => {
      const withoutCreator = prev.filter((id) => !creatorGroupIds.includes(id))
      return checked ? [...withoutCreator, ...creatorGroupIds] : withoutCreator
    })
  }

  function handleGroupSelection(groupId: string) {
    setSelectedGroup((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    )
  }

  function handleDeletePin(pinId: string) {
    deletePinM.mutate({ id: pinId })
  }

  function handleDeleteGroup(groupId: string) {
    deleteGroupM.mutate({ id: groupId })
  }

  return (
    <div className="w-full">

      {/* ── Global select-all toolbar (pending only) ── */}
      {mode === "pending" && (
        <div className="flex items-center justify-between gap-3 mb-4 px-3 py-2 bg-gray-50 border rounded-md">
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate
              }}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            Select all
            <span className="text-gray-500 font-normal">
              ({selectedGroup.length} / {allGroupIds.length} selected)
            </span>
          </label>

          {selectedGroup.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                className="btn btn-sm btn-error"
                onClick={() => approveM.mutate({ locationGroupIds: selectedGroup, approved: false })}
                disabled={approveM.isLoading}
              >
                <X className="h-3 w-3" />
                Reject
              </button>
              <button
                className="btn btn-sm btn-success"
                onClick={() => approveM.mutate({ locationGroupIds: selectedGroup, approved: true })}
                disabled={approveM.isLoading}
              >
                <Check className="h-3 w-3" />
                Approve
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Creator sections ── */}
      <div className="space-y-4">
        {Object.entries(groupsByCreator).map(([creatorId, creatorGroups]) => {
          const creatorName = creatorGroups[0]?.creator.name ?? "Unknown Creator"
          const creatorGroupIds = creatorGroups.map((g) => g.id)
          const allCreatorSelected = creatorGroupIds.every((id) => selectedGroup.includes(id))
          const someCreatorSelected = creatorGroupIds.some((id) => selectedGroup.includes(id))

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
            <div key={`creator-${creatorId}`} className="border rounded-md overflow-hidden">
              <Collapsible className="w-full">
                <div className="flex items-center justify-between bg-gray-50 p-3 gap-2">
                  <h4 className="text-sm font-semibold truncate">
                    {CREATOR_TERM}: {creatorName}
                  </h4>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Per-creator select-all (pending only) */}
                    {mode === "pending" && (
                      <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-gray-600 border rounded px-2 py-1 bg-white hover:bg-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs"
                          checked={allCreatorSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someCreatorSelected && !allCreatorSelected
                          }}
                          onChange={(e) => handleCreatorSelectAll(creatorId, e.target.checked)}
                        />
                        Select all
                      </label>
                    )}

                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex-shrink-0 h-8 w-8 p-0">
                        <ChevronDown className="h-4 w-4" />
                        <span className="sr-only">Toggle</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>

                <CollapsibleContent>
                  <div className="p-3 space-y-3">
                    {Object.entries(groupPins).map(([key, pins]) => (
                      <div key={key} className="border rounded overflow-hidden bg-white">
                        <Collapsible className="w-full">
                          <div className="flex items-center justify-between p-2 bg-gray-50">
                            <div className="flex items-center gap-2 flex-grow overflow-hidden">
                              {mode === "pending" && (
                                <label className="flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={selectedGroup.includes(key)}
                                    onChange={() => handleGroupSelection(key)}
                                  />
                                </label>
                              )}
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium">Title: {pins[0]?.title}</span>
                                <span className="text-xs text-gray-600">
                                  Description: {pins[0]?.description}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {mode === "approved" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteGroup(key)
                                  }}
                                  className="h-7 w-7 p-0"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                          </div>

                          <CollapsibleContent>
                            <div className="w-full overflow-x-auto p-1">
                              <table className="w-full border-collapse text-sm">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="p-1 text-left">Image</th>
                                    <th className="p-1 text-left">ID</th>
                                    <th className="p-1 text-left whitespace-nowrap">Lat | Long</th>
                                    {mode === "approved" && <th className="p-1 text-left">Actions</th>}
                                  </tr>
                                </thead>
                                <tbody>
                                  {pins.map((pin) =>
                                    pin.locations.map((location, index) => (
                                      <tr
                                        key={location.id}
                                        className={`border-t border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                                      >
                                        <td className="p-1">
                                          <Image
                                            alt="pin image"
                                            width={32}
                                            height={32}
                                            src={pin.image ?? "https://app.wadzzo.com/images/loading.png"}
                                            className="h-8 w-8 object-cover rounded"
                                          />
                                        </td>
                                        <td className="p-1 font-mono text-xs">
                                          <div className="max-w-xs truncate">{location.id}</div>
                                        </td>
                                        <td className="p-1 text-xs whitespace-nowrap">
                                          {location.latitude.toFixed(4)} | {location.longitude.toFixed(4)}
                                        </td>
                                        {mode === "approved" && (
                                          <td className="p-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleDeletePin(location.id)}
                                              className="h-6 w-6 p-0"
                                            >
                                              <Trash2 className="h-3 w-3 text-red-500" />
                                            </Button>
                                          </td>
                                        )}
                                      </tr>
                                    )),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )
        })}
      </div>

      {pinData && <PinInfoUpdateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} pinData={pinData} />}
    </div>
  )
}