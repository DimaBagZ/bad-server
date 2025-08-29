/**
 * Экранирует HTML символы для предотвращения XSS атак
 */
export function escapeHtml(text: string): string {
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

/**
 * Экранирует атрибуты HTML
 */
export function escapeHtmlAttribute(text: string): string {
    return text.replace(/[&<>"'/]/g, (char) => {
        const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;',
        }
        return map[char]
    })
}
