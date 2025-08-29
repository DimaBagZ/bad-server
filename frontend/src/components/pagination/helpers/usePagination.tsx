import { AsyncThunk } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from '@store/hooks'
import { RootState } from '@store/store'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

interface PaginationResult<_T, U> {
    data: U[]
    totalPages: number
    currentPage: number
    limit: number
    nextPage: () => void
    prevPage: () => void
    setPage: (page: number) => void
    setLimit: (limit: number) => void
}

const usePagination = <T, U>(
    asyncAction: AsyncThunk<T, Record<string, unknown>, { state: RootState }>,
    selector: (state: RootState) => U[],
    defaultLimit: number
): PaginationResult<T, U> => {
    const dispatch = useDispatch()
    const data = useSelector(selector)
    const [searchParams, setSearchParams] = useSearchParams()
    const [totalPages, setTotalPages] = useState<number>(1)

    const currentPage = Math.min(
        Number(searchParams.get('page')) || 1,
        totalPages
    )

    const limit = Number(searchParams.get('limit')) || defaultLimit

    const fetchData = useCallback(
        async (params: Record<string, unknown>) => {
            const response = await dispatch(asyncAction(params))
            if (
                'payload' in response &&
                response.payload &&
                typeof response.payload === 'object' &&
                'pagination' in response.payload
            ) {
                const pagination = (
                    response.payload as { pagination: { totalPages: number } }
                ).pagination
                setTotalPages(pagination.totalPages)
            }
        },
        [dispatch, asyncAction]
    )

    const updateURL = useCallback(
        (newParams: Record<string, unknown>) => {
            const updatedParams = new URLSearchParams(searchParams)
            Object.entries(newParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    updatedParams.set(key, value.toString())
                } else {
                    updatedParams.delete(key)
                }
            })
            setSearchParams(updatedParams)
        },
        [searchParams, setSearchParams]
    )

    const nextPage = () => {
        if (currentPage < totalPages) {
            updateURL({ page: currentPage + 1, limit })
        }
    }

    const prevPage = () => {
        if (currentPage > 1) {
            updateURL({ page: currentPage - 1, limit })
        }
    }

    const setPage = useCallback(
        (page: number) => {
            const newPage = Math.max(1, Math.min(page, totalPages))
            updateURL({ page: newPage, limit })
        },
        [totalPages, limit, updateURL]
    )

    const setLimit = (newLimit: number) => {
        updateURL({ page: 1, limit: newLimit }) // При изменении лимита возвращаемся на первую страницу
    }

    useEffect(() => {
        const params = Object.fromEntries(searchParams.entries())
        fetchData({ ...params, page: currentPage, limit }).then(() => {
            if (data.length === 0 && currentPage > 1) {
                setPage(1)
            }
        })
    }, [currentPage, limit, searchParams, fetchData, data.length, setPage])

    return {
        data,
        totalPages,
        currentPage,
        limit,
        nextPage,
        prevPage,
        setPage,
        setLimit,
    }
}

export default usePagination
