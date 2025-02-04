export function formatConvHistory(messages) {
    return messages.map((message, i) => {
        if (i % 2 === 0){
            return `Human: ${message.message}`
        } else {
            return `AI: ${message.message}`
        }
    }).join('\n')
}
