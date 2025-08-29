import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import weblarekApi from '../utils/weblarek-api'
import { rootReducer } from './rootReducer'

// Конфигурация для Redux Persist
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['basket'], // Сохраняем только корзину
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
    reducer: persistedReducer,
    devTools: import.meta.env.MODE !== 'production',
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            thunk: {
                extraArgument: weblarekApi,
            },
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof rootReducer>

export type AppDispatch = typeof store.dispatch

export default store
