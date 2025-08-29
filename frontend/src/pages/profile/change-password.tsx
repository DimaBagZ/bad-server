import React, { useState } from 'react'
import weblarekApi from '../../utils/weblarek-api'
import styles from '../../components/order/order.module.scss'
import Button from '../../components/button'
import { Input } from '../../components/form'

// Валидация пароля
const validatePassword = (password: string) => {
    if (password.length < 6) {
        return 'Минимальная длина пароля 6 символов'
    }
    return ''
}

export default function ChangePassword() {
    const [current, setCurrent] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [message, setMessage] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Ошибки валидации
    const [errors, setErrors] = useState({
        current: '',
        password: '',
        confirm: '',
    })

    const validateForm = () => {
        const newErrors = {
            current: !current ? 'Введите текущий пароль' : '',
            password: validatePassword(password),
            confirm: password !== confirm ? 'Пароли не совпадают' : '',
        }
        setErrors(newErrors)
        return !newErrors.current && !newErrors.password && !newErrors.confirm
    }

    const handleCurrentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrent(e.target.value)
        if (errors.current) {
            setErrors((prev) => ({ ...prev, current: '' }))
        }
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value)
        if (errors.password) {
            setErrors((prev) => ({ ...prev, password: '' }))
        }
        if (errors.confirm && e.target.value === confirm) {
            setErrors((prev) => ({ ...prev, confirm: '' }))
        }
    }

    const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirm(e.target.value)
        if (errors.confirm) {
            setErrors((prev) => ({ ...prev, confirm: '' }))
        }
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage('')

        if (!validateForm()) {
            return
        }

        setSubmitting(true)
        try {
            await weblarekApi.changePassword({
                currentPassword: current,
                newPassword: password,
                confirmPassword: confirm,
            })
            setMessage('Пароль успешно изменён')
            setCurrent('')
            setPassword('')
            setConfirm('')
            setErrors({ current: '', password: '', confirm: '' })
        } catch (err: unknown) {
            const errorMessage =
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message: string }).message
                    : 'Не удалось изменить пароль'
            setMessage(errorMessage)
        } finally {
            setSubmitting(false)
        }
    }
    return (
        <form onSubmit={onSubmit} className={styles.order}>
            <h2 className={styles.order__title}>Смена пароля</h2>
            <div className={styles.order__field}>
                <Input
                    label='Текущий пароль'
                    type='password'
                    value={current}
                    onChange={handleCurrentChange}
                    placeholder='Введите текущий пароль'
                    error={errors.current}
                    required
                />
            </div>
            <div className={styles.order__field}>
                <Input
                    label='Новый пароль'
                    type='password'
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder='Введите новый пароль'
                    error={errors.password}
                    required
                />
            </div>
            <div className={styles.order__field}>
                <Input
                    label='Новый пароль ещё раз'
                    type='password'
                    value={confirm}
                    onChange={handleConfirmChange}
                    placeholder='Введите новый пароль ещё раз'
                    error={errors.confirm}
                    required
                />
            </div>
            <div className={styles.order__buttons}>
                <Button
                    type='submit'
                    disabled={
                        submitting ||
                        !current ||
                        !password ||
                        password !== confirm
                    }
                >
                    {submitting ? 'Сохраняем...' : 'Сохранить'}
                </Button>
            </div>
            {message && <p>{message}</p>}
        </form>
    )
}
