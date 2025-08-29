import { Request, Response, NextFunction } from 'express'
import { Types, PipelineStage, Error as MongooseError } from 'mongoose'
import Order, { IOrder, StatusType } from '../models/order'
import Product, { IProduct } from '../models/product'
import User from '../models/user'
import BadRequestError from '../errors/bad-request-error'
import NotFoundError from '../errors/not-found-error'
import escapeRegExp from '../utils/escapeRegExp'

interface SearchCondition {
    [key: string]: RegExp | number
}

// eslint-disable-next-line max-len
// GET /orders?page=2&limit=5&sort=totalAmount&order=desc&orderDateFrom=2024-07-01&orderDateTo=2024-08-01&status=delivering&totalAmountFrom=100&totalAmountTo=1000&search=%2B1

export const getOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortField = 'createdAt',
            sortOrder = 'desc',
            status,
            totalAmountFrom,
            totalAmountTo,
            orderDateFrom,
            orderDateTo,
            search,
        } = req.query

        const filters: Record<string, unknown> = {}

        if (status && typeof status === 'string') {
            // Принимаем только значения из enum статусов
            if ((Object.values(StatusType) as string[]).includes(status)) {
                filters.status = status
            }
        }

        if (totalAmountFrom) {
            const existingTotalAmount =
                (filters.totalAmount as Record<string, unknown>) || {}
            filters.totalAmount = {
                ...existingTotalAmount,
                $gte: Number(totalAmountFrom),
            }
        }

        if (totalAmountTo) {
            const existingTotalAmount =
                (filters.totalAmount as Record<string, unknown>) || {}
            filters.totalAmount = {
                ...existingTotalAmount,
                $lte: Number(totalAmountTo),
            }
        }

        if (orderDateFrom) {
            const existingCreatedAt =
                (filters.createdAt as Record<string, unknown>) || {}
            filters.createdAt = {
                ...existingCreatedAt,
                $gte: new Date(orderDateFrom as string),
            }
        }

        if (orderDateTo) {
            const existingCreatedAt =
                (filters.createdAt as Record<string, unknown>) || {}
            filters.createdAt = {
                ...existingCreatedAt,
                $lte: new Date(orderDateTo as string),
            }
        }

        const aggregatePipeline: PipelineStage[] = [
            { $match: filters },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products',
                    foreignField: '_id',
                    as: 'products',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'customer',
                    foreignField: '_id',
                    as: 'customer',
                },
            },
            { $unwind: '$customer' },
            { $unwind: '$products' },
        ]

        // Проверка на избыточную агрегацию (защита от инъекции)
        if (aggregatePipeline.length > 5) {
            return res.status(400).json({ error: 'Aggregation too complex' })
        }

        // Дополнительная проверка на сложные операторы
        const pipelineString = JSON.stringify(aggregatePipeline)
        if (
            pipelineString.includes('$where') ||
            pipelineString.includes('$eval')
        ) {
            return res
                .status(400)
                .json({ error: 'Dangerous aggregation operators detected' })
        }

        if (search) {
            // Экранируем строку поиска, чтобы избежать ошибок regexp и ReDoS
            const safe = escapeRegExp(String(search))
            const searchRegex = new RegExp(safe, 'i')
            const searchNumber = Number(search)

            const searchConditions: SearchCondition[] = [
                { 'products.title': searchRegex },
            ]

            if (!Number.isNaN(searchNumber)) {
                searchConditions.push({ orderNumber: searchNumber })
            }

            aggregatePipeline.push({
                $match: {
                    $or: searchConditions,
                },
            })

            filters.$or = searchConditions
        }

        const sort: { [key: string]: 1 | -1 } = {}

        if (sortField && sortOrder) {
            sort[sortField as string] = sortOrder === 'desc' ? -1 : 1
        }

        // Нормализуем лимит пагинации (1..10)
        const rawLimit = Number(limit)
        const safeLimit = Math.max(
            1,
            Math.min(10, Number.isFinite(rawLimit) ? rawLimit : 10)
        )

        aggregatePipeline.push(
            { $sort: sort },
            { $skip: (Number(page) - 1) * safeLimit },
            { $limit: safeLimit },
            {
                $group: {
                    _id: '$_id',
                    orderNumber: { $first: '$orderNumber' },
                    status: { $first: '$status' },
                    totalAmount: { $first: '$totalAmount' },
                    products: { $push: '$products' },
                    customer: { $first: '$customer' },
                    createdAt: { $first: '$createdAt' },
                },
            }
        )

        const orders = await Order.aggregate(aggregatePipeline)
        const totalOrders = await Order.countDocuments(filters)
        const totalPages = Math.ceil(totalOrders / safeLimit)

        res.status(200).json({
            orders,
            pagination: {
                totalOrders,
                totalPages,
                currentPage: Number(page),
                pageSize: safeLimit,
            },
        })
    } catch (error) {
        next(error)
    }
}

export const getOrdersCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = res.locals.user._id
        const { search, page = 1, limit = 5 } = req.query
        const options = {
            skip: (Number(page) - 1) * Number(limit),
            limit: Number(limit),
        }

        const user = await User.findById(userId)
            .populate({
                path: 'orders',
                populate: [
                    {
                        path: 'products',
                    },
                    {
                        path: 'customer',
                    },
                ],
            })
            .orFail(
                () =>
                    new NotFoundError(
                        'Пользователь по заданному id отсутствует в базе'
                    )
            )

        let orders = user.orders as unknown as IOrder[]

        if (search) {
            // если не экранировать то получаем Invalid regular expression: /+1/i: Nothing to repeat
            const searchNumber = Number(search)

            orders = orders.filter((order) => {
                const productIds = order.products.map((product) => product._id)
                // eslint-disable-next-line max-len
                const matchesProductTitle = order.products.some((product) =>
                    productIds.some((id: Types.ObjectId) =>
                        id.equals(product._id)
                    )
                )
                // eslint-disable-next-line max-len
                const matchesOrderNumber =
                    !Number.isNaN(searchNumber) &&
                    order.orderNumber === searchNumber

                return matchesOrderNumber || matchesProductTitle
            })
        }

        const totalOrders = orders.length
        const totalPages = Math.ceil(totalOrders / Number(limit))

        orders = orders.slice(options.skip, options.skip + options.limit)

        return res.send({
            orders,
            pagination: {
                totalOrders,
                totalPages,
                currentPage: Number(page),
                pageSize: Number(limit),
            },
        })
    } catch (error) {
        next(error)
    }
}

// Get order by ID
export const getOrderByNumber = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const order = await Order.findOne({
            orderNumber: req.params.orderNumber,
        })
            .populate(['customer', 'products'])
            .orFail(
                () =>
                    new NotFoundError(
                        'Заказ по заданному id отсутствует в базе'
                    )
            )
        return res.status(200).json(order)
    } catch (error) {
        if (error instanceof MongooseError.CastError) {
            return next(new BadRequestError('Передан не валидный ID заказа'))
        }
        return next(error)
    }
}

export const getOrderCurrentUserByNumber = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const userId = res.locals.user._id
    try {
        const order = await Order.findOne({
            orderNumber: req.params.orderNumber,
        })
            .populate(['customer', 'products'])
            .orFail(
                () =>
                    new NotFoundError(
                        'Заказ по заданному id отсутствует в базе'
                    )
            )
        if (!order.customer._id.equals(userId)) {
            // Если нет доступа не возвращаем 403, а отдаем 404
            return next(
                new NotFoundError('Заказ по заданному id отсутствует в базе')
            )
        }
        return res.status(200).json(order)
    } catch (error) {
        if (error instanceof MongooseError.CastError) {
            return next(new BadRequestError('Передан не валидный ID заказа'))
        }
        return next(error)
    }
}

// POST /product
export const createOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const basket: IProduct[] = []
        const products = await Product.find<IProduct>({})
        const userId = res.locals.user._id
        const { address, payment, phone, total, email, items, comment } =
            req.body

        items.forEach((id: Types.ObjectId) => {
            const product = products.find((p) => {
                if (p._id && typeof p._id === 'object' && 'equals' in p._id) {
                    return (p._id as Types.ObjectId).equals(id)
                }
                return false
            })
            if (!product) {
                throw new BadRequestError(`Товар с id ${id} не найден`)
            }
            if (product.price === null) {
                throw new BadRequestError(`Товар с id ${id} не продается`)
            }
            return basket.push(product)
        })
        const totalBasket = basket.reduce((a, c) => a + c.price, 0)
        if (totalBasket !== total) {
            return next(new BadRequestError('Неверная сумма заказа'))
        }

        const newOrder = new Order({
            totalAmount: total,
            products: items,
            payment,
            phone,
            email,
            comment,
            customer: userId,
            deliveryAddress: address,
        })
        const populateOrder = await newOrder.populate(['customer', 'products'])
        await populateOrder.save()

        return res.status(200).json(populateOrder)
    } catch (error) {
        if (error instanceof MongooseError.ValidationError) {
            return next(new BadRequestError(error.message))
        }
        return next(error)
    }
}

// Update an order
export const updateOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { status } = req.body
        const updatedOrder = await Order.findOneAndUpdate(
            { orderNumber: req.params.orderNumber },
            { status },
            { new: true, runValidators: true }
        )
            .orFail(
                () =>
                    new NotFoundError(
                        'Заказ по заданному id отсутствует в базе'
                    )
            )
            .populate(['customer', 'products'])
        return res.status(200).json(updatedOrder)
    } catch (error) {
        if (error instanceof MongooseError.ValidationError) {
            return next(new BadRequestError(error.message))
        }
        if (error instanceof MongooseError.CastError) {
            return next(new BadRequestError('Передан не валидный ID заказа'))
        }
        return next(error)
    }
}

// Delete an order
export const deleteOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id)
            .orFail(
                () =>
                    new NotFoundError(
                        'Заказ по заданному id отсутствует в базе'
                    )
            )
            .populate(['customer', 'products'])
        return res.status(200).json(deletedOrder)
    } catch (error) {
        if (error instanceof MongooseError.CastError) {
            return next(new BadRequestError('Передан не валидный ID заказа'))
        }
        return next(error)
    }
}
