"use client"

import { useState } from "react"
import { api } from "~/utils/api"

export function useClaimableBalances(homeDomain: string, initialLimit = 10) {
    const [balances, setBalances] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [nextCursor, setNextCursor] = useState<string | undefined>()

    const fetchBalances = async (cursor?: string) => {
        setIsLoading(true)
        setError(null)

        try {
            const result = api.walletBalance.wallBalance.getGiftWithHomeBalance.useInfiniteQuery(
                { limit: initialLimit },
                {
                    getNextPageParam: (lastPage) => lastPage.nextCursor,
                }
            )

            if (cursor) {
                setBalances((prev) => [...prev, ...result.balances])
            } else {
                setBalances(result.balances)
            }

            setNextCursor(result.nextCursor)
            setHasMore(result.hasMore)
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Failed to fetch balances"))
        } finally {
            setIsLoading(false)
        }
    }

    const loadMore = () => {
        if (!isLoading && hasMore && nextCursor) {
            fetchBalances(nextCursor)
        }
    }

    const refresh = () => {
        setNextCursor(undefined)
        setHasMore(true)
        fetchBalances()
    }

    return {
        balances,
        isLoading,
        error,
        hasMore,
        loadMore,
        refresh,
    }
}

