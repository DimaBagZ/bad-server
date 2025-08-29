import clsx from 'clsx'
import { ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './modal.module.scss'
type ModalProps = {
    children: ReactNode
    onClose: () => void
    title?: string
}

const modalRoot = document.getElementById('modals')

export default function Modal({ children, onClose, title }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            e.key === 'Escape' && onClose()
        }

        // Скроллим к модалке после рендера
        setTimeout(() => {
            if (modalRef.current) {
                modalRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                })
            }
        }, 100)

        document.addEventListener('keydown', handleEsc)
        return () => {
            document.removeEventListener('keydown', handleEsc)
        }
    }, [onClose])

    return createPortal(
        <div
            ref={modalRef}
            className={clsx(styles.modal, styles.modal_active)}
            onClick={onClose}
        >
            <div
                className={styles.modal__container}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className={styles.modal__close}
                    aria-label='закрыть'
                    onClick={onClose}
                ></button>
                <div className={styles.modal__content}>
                    {title && <h2 className={styles.modal__title}>{title}</h2>}
                    {children}
                </div>
            </div>
        </div>,
        modalRoot as HTMLDivElement
    )
}
