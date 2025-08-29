/**
 * Безопасно отображает HTML контент с экранированием
 * Используется для предотвращения XSS атак
 */

import React from 'react'

// Функция для экранирования HTML
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    }
    return text.replace(/[&<>"'/]/g, (m) => map[m])
}

// Разрешенные HTML теги для безопасного отображения
const allowedTags = [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'ol',
    'ul',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
]

// Функция для безопасного парсинга HTML
function parseSafeHtml(html: string): string {
    // Создаем временный элемент для парсинга
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html

    // Рекурсивно очищаем DOM
    function cleanNode(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE) {
            return escapeHtml(node.textContent || '')
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            const tagName = element.tagName.toLowerCase()

            // Если тег не разрешен, возвращаем только текст
            if (!allowedTags.includes(tagName)) {
                return Array.from(element.childNodes).map(cleanNode).join('')
            }

            // Для разрешенных тегов сохраняем структуру
            const attributes = Array.from(element.attributes)
                .filter((attr) =>
                    ['class', 'id', 'style'].includes(attr.name.toLowerCase())
                )
                .map((attr) => `${attr.name}="${escapeHtml(attr.value)}"`)
                .join(' ')

            const openTag = attributes
                ? `<${tagName} ${attributes}>`
                : `<${tagName}>`
            const content = Array.from(element.childNodes)
                .map(cleanNode)
                .join('')
            const closeTag = `</${tagName}>`

            return openTag + content + closeTag
        }

        return ''
    }

    return cleanNode(tempDiv)
}

/**
 * Компонент для безопасного отображения HTML
 */
export function SafeHtml({
    html,
    className,
}: {
    html: string
    className?: string
}) {
    if (!html) {
        return null
    }

    try {
        const safeHtml = parseSafeHtml(html)
        return React.createElement('div', {
            className,
            dangerouslySetInnerHTML: { __html: safeHtml },
        })
    } catch (error) {
        // В случае ошибки парсинга, отображаем экранированный текст
        return React.createElement('div', { className }, escapeHtml(html))
    }
}

/**
 * Простая функция для экранирования текста
 */
export function SafeText({
    text,
    className,
}: {
    text: string
    className?: string
}) {
    if (!text) {
        return null
    }

    return React.createElement('div', { className }, escapeHtml(text))
}
