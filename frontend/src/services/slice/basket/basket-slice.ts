import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { IProduct } from '../../../utils/types'
import { IBasket } from './../../../utils/types/index'

const initialState: IBasket = {
    items: [],
    totalCount: 0,
}

export const basketSlice = createSlice({
    name: 'basket',
    initialState,
    reducers: {
        addProductCart: (state, { payload }: PayloadAction<IProduct>) => {
            const itemInCart = state.items.find(
                (item) => item._id === payload._id
            ) //undefined or product
            if (itemInCart) {
                return state
            } else {
                state.items.push(payload)
                state.totalCount = state.items.length
            }
        },
        removeProductCart: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter(
                (item) => item._id !== action.payload
            )
            state.totalCount = state.items.length
        },
        resetBasket: () => {
            return { items: [], totalCount: 0 }
        },
    },
    selectors: {
        selectBasketItems: (state: IBasket) => state.items,
        selectBasketTotalCount: (state: IBasket) => state.totalCount,
    },
})
