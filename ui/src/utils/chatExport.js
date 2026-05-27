import { downloadBlob, sanitizeFilename, timestamp } from './download'

function formatRole(role) {
  return role === 'user' ? 'You' : 'Advisor'
}

function formatTimestamp(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function formatChatSessionTxt(session, messages) {
  const title = session?.title || 'Chat'
  const lines = [
    'Energy LAB — Bankability Advisor',
    `Chat: ${title}`,
    `Exported: ${new Date().toLocaleString()}`,
    '',
    '─'.repeat(60),
    '',
  ]

  if (!messages.length) {
    lines.push('(No messages in this chat.)', '')
  } else {
    for (const msg of messages) {
      lines.push(`[${formatRole(msg.role)}] ${formatTimestamp(msg.createdAt)}`)
      lines.push(msg.content)
      lines.push('')
    }
  }

  lines.push('─'.repeat(60))
  return lines.join('\n')
}

export function downloadChatSessionTxt(session, messages) {
  const title = session?.title || 'chat'
  const body = formatChatSessionTxt(session, messages)
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' })
  const filename = `energy-lab-chat-${sanitizeFilename(title)}-${timestamp()}.txt`
  downloadBlob(blob, filename)
}
