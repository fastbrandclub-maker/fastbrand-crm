import { MessageCircle } from 'lucide-react'

export function buildRelanceMessage(firstNames) {
  const clean = firstNames.filter(Boolean)
  if (clean.length <= 1) {
    const name = clean[0]
    return name
      ? `Hello, ${name} tu vas bien ? Des news de ton côté ?`
      : `Hello, tu vas bien ? Des news de ton côté ?`
  }
  return `Hello, vous allez bien ? Des news de votre côté ?`
}

export default function RelanceButton({ firstName, groupUrl, groupMembers, size = 'md' }) {
  const members = (groupMembers && groupMembers.length > 0) ? groupMembers : [firstName]
  const message = buildRelanceMessage(members)

  const dim = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'
  const icon = size === 'sm' ? 12 : 14

  if (!groupUrl) {
    return (
      <span
        title="Pas de groupe WhatsApp renseigné — éditer l'élève pour ajouter le lien"
        className={`${dim} flex items-center justify-center rounded-lg bg-zinc-800/40 border border-zinc-700/40 shrink-0 cursor-not-allowed`}
      >
        <MessageCircle size={icon} className="text-zinc-600" />
      </span>
    )
  }

  async function handleClick(e) {
    e.preventDefault()
    e.stopPropagation()
    let ok = true
    try {
      await navigator.clipboard.writeText(message)
    } catch (_) {
      ok = false
    }

    const notif = document.createElement('div')
    notif.innerHTML = ok
      ? `<div style="font-weight:700;font-size:14px;margin-bottom:6px">✓ Message copié</div>
         <div style="font-size:12px;opacity:.9;margin-bottom:8px">"${message}"</div>
         <div style="font-size:12px;font-weight:600">Une fois dans le groupe → <kbd style="background:#fff;color:#065f46;padding:2px 6px;border-radius:4px;font-family:monospace">⌘ V</kbd></div>`
      : `Copie échouée — copie manuellement :<br><strong>${message}</strong>`
    notif.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:14px 20px;border-radius:12px;font-size:13px;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,.4);max-width:420px;line-height:1.4'
    document.body.appendChild(notif)
    setTimeout(() => notif.remove(), 5000)

    setTimeout(() => {
      window.open(groupUrl, '_blank', 'noopener,noreferrer')
    }, 1200)
  }

  return (
    <button
      onClick={handleClick}
      title={`Relancer dans le groupe WhatsApp (message copié)`}
      className={`${dim} flex items-center justify-center rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors shrink-0`}
    >
      <MessageCircle size={icon} className="text-emerald-400" />
    </button>
  )
}
