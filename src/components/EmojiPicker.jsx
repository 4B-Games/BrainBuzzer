import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

const CATEGORIES = [
  {
    id: 'smileys', icon: '😊', label: 'Smileys',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','🫠','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🫡','🤔','🫣','🤭','🤫','🤥','😶','🫥','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🫨','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','😢','😭','😥','😓','😟','😕','🙁','☹️','😤','😠','😡','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾'],
  },
  {
    id: 'people', icon: '👋', label: 'Menschen',
    emojis: ['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','👀','👁️','👅','👄','🫦','💋','👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','💆','💇','🚶','🧍','🧎','🏃','💃','🕺','🧖','🧗','🏋️','🤸','🤺','⛹️','🤾','🏌️','🧘','🏊','🚴','🛀','👫','👬','👭','💑','💏','👨‍👩‍👧','👨‍👩‍👦','👨‍👩‍👧‍👦','🧑‍🤝‍🧑'],
  },
  {
    id: 'animals', icon: '🐶', label: 'Tiere',
    emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🦝','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐞','🦟','🦗','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🦮','🐈','🐓','🦃','🦚','🦜','🦢','🕊️','🐇','🦝','🦦','🦥','🐁','🐀','🐿️','🦔','🌵','🎄','🌲','🌳','🌴','🌱','🌿','☘️','🍀','🍃','🍂','🍁','🍄','🌾','💐','🌷','🌹','🥀','🪷','🌺','🌸','🌼','🌻','🌞','⭐','🌟','✨','❄️','🌊','🔥','🌈','🌙','☀️','⚡','🌪️'],
  },
  {
    id: 'food', icon: '🍎', label: 'Essen',
    emojis: ['🍏','🍎','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🫒','🥑','🍆','🥦','🥬','🥒','🌶️','🧄','🧅','🥔','🍠','🥐','🥖','🍞','🥨','🧀','🍳','🥚','🍖','🍗','🥩','🥓','🌭','🍔','🍟','🍕','🫓','🌮','🌯','🥙','🥗','🥘','🍱','🍣','🍛','🍜','🍝','🍲','🥫','🍿','🧈','🍦','🍧','🍨','🍡','🧁','🎂','🍰','🍮','🍭','🍬','🍫','🍩','🍪','🌰','🍯','☕','🫖','🍵','🧃','🥤','🧋','🍺','🍻','🥂','🍷','🥃','🍹','🍸','🍾','🧊','🥄','🍴','🍽️','🥢'],
  },
  {
    id: 'travel', icon: '✈️', label: 'Reisen',
    emojis: ['🌍','🌎','🌏','🗺️','🧭','🏔️','🌋','🗻','🏕️','🏖️','🏜️','🏝️','🏞️','🏟️','🏛️','🏗️','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','🗼','🗽','⛪','🕌','🛕','🕍','⛩️','🕋','⛲','⛺','🌁','🌃','🏙️','🌄','🌅','🌆','🌇','🌉','🌌','🎆','🎇','🚗','🚕','🚙','🚌','🏎️','🚓','🚑','🚒','🛻','🚚','🚛','🚜','🏍️','🛵','🚲','🛴','🛺','✈️','🛩️','🚀','🛸','🚁','🚢','⛵','🛥️','🚤','🛶','🚂','🚃','🚄','🚅','🚇','🚊','🚝','🚞','🚋','🚏','🛣️','🛤️','⛽','🚧','⚓','🪝','🚦','🚥','🛂','🛃','🛄','🛅'],
  },
  {
    id: 'activities', icon: '⚽', label: 'Sport',
    emojis: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🥅','⛳','🪃','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','🤺','⛹️','🤾','🏌️','🏇','🧘','🧗','🚴','🏊','🤽','🚣','🏄','🏆','🥇','🥈','🥉','🏅','🎖️','🎗️','🎫','🎟️','🎪','🤹','🎭','🎨','🖼️','🎬','🎤','🎧','🎼','🎵','🎶','🎷','🪗','🎸','🎹','🎺','🎻','🪕','🥁','🪘','🎲','♟️','🎯','🎳','🎮','🎰','🧩','🧸','🪅','🪆','♠️','♥️','♦️','♣️','🃏','🀄','🎴'],
  },
  {
    id: 'objects', icon: '💡', label: 'Objekte',
    emojis: ['📱','💻','🖥️','⌨️','🖱️','🖨️','💾','💿','📀','📷','📸','📹','🎥','📺','📻','☎️','📞','📟','📠','📡','🔋','🔌','💡','🔦','🕯️','🪔','🧯','⚖️','🧲','🔧','🔨','⚒️','🛠️','🔩','🪛','🔑','🗝️','🔐','🔒','🔓','🚪','🪞','🪟','🛋️','🪑','🛏️','🛁','🚿','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🧽','🛒','💊','💉','🩹','🩺','🔬','🔭','🧬','🧪','🌡️','🪤','🧰','⚙️','🔗','🪝','🧱','🎁','🎀','🎊','🎉','🎈','🎏','🎐','🎑','🧧','🛍️','📦','📫','📬','📭','📮','✉️','📧','📝','✏️','🖊️','🖋️','🖌️','🖍️','📌','📍','📎','📏','📐','✂️','🗂️','📊','📈','📉','📋','📅','📆','🗓️','📇','🗃️','🗄️','🗑️','🔍','🔎','📖','📚','📓','📔','📒','📕','📗','📘','📙','📃','📄','📑','🗒️','🔖','💬','💭','📣','📢','🔔','🔕','🔇','🔈','🔉','🔊','🎵','🎶','💤','⌚','⏱️','⏲️','⏰','🕰️','⌛','⏳','🧭','💰','💴','💵','💶','💷','💸','💳','🪙','💎'],
  },
  {
    id: 'symbols', icon: '❤️', label: 'Symbole',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','☯️','☦️','🛐','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','⛎','🆔','⚛️','☢️','☣️','✅','❌','❎','🛑','⛔','📛','🚫','💯','💢','♨️','🔱','⚜️','🔰','♻️','⚠️','🚸','🆚','🆕','🆓','🆒','🆙','🆗','🆘','🅰️','🅱️','🅾️','🆎','🆑','💹','🔤','🔡','🔠','🔢','#️⃣','*️⃣','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','▶️','⏸️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','⏏️','🔀','🔁','🔂','🔃','🔄','🔙','🔚','🔛','🔜','🔝','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↩️','↪️','⤴️','⤵️','🌀','〰️','➕','➖','➗','✖️','✔️','✳️','✴️','❇️','‼️','⁉️','❓','❔','❕','❗','©️','®️','™️','💲','💱'],
  },
  {
    id: 'flags', icon: '🏁', label: 'Flaggen',
    emojis: ['🏳️','🏴','🏁','🚩','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇩🇪','🇦🇹','🇨🇭','🇧🇪','🇳🇱','🇱🇺','🇫🇷','🇲🇨','🇪🇸','🇵🇹','🇮🇹','🇸🇲','🇻🇦','🇬🇷','🇨🇾','🇲🇹','🇵🇱','🇨🇿','🇸🇰','🇭🇺','🇷🇴','🇧🇬','🇭🇷','🇸🇮','🇷🇸','🇧🇾','🇺🇦','🇲🇩','🇷🇺','🇪🇪','🇱🇻','🇱🇹','🇫🇮','🇸🇪','🇳🇴','🇩🇰','🇮🇸','🇮🇪','🇬🇧','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🏴󠁧󠁢󠁳󠁣󠁴󠁿','🏴󠁧󠁢󠁷󠁬󠁳󠁿','🇺🇸','🇨🇦','🇲🇽','🇧🇷','🇦🇷','🇨🇱','🇨🇴','🇵🇪','🇯🇵','🇰🇷','🇨🇳','🇹🇼','🇭🇰','🇮🇳','🇵🇰','🇧🇩','🇮🇷','🇮🇶','🇸🇾','🇱🇧','🇮🇱','🇸🇦','🇾🇪','🇦🇪','🇹🇷','🇦🇿','🇬🇪','🇦🇲','🇺🇿','🇰🇿','🇦🇫','🇮🇩','🇲🇾','🇵🇭','🇸🇬','🇹🇭','🇻🇳','🇦🇺','🇳🇿','🇿🇦','🇳🇬','🇪🇬','🇪🇹','🇰🇪','🇹🇿','🇬🇭','🇨🇮','🇸🇳','🇩🇿','🇲🇦','🇹🇳'],
  },
]

// Build a flat searchable list: { emoji, keywords }
const ALL_EMOJIS = CATEGORIES.flatMap(c => c.emojis)

export default function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [activeCat, setActiveCat] = useState('smileys')
  const [search, setSearch] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const searchRef  = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e) {
      if (!e.target.closest('.emoji-picker-root')) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // Auto-focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  function handleOpen() {
    if (!triggerRef.current) return
    const rect   = triggerRef.current.getBoundingClientRect()
    const pw     = 400
    const ph     = 360

    let top  = rect.bottom + 6
    if (top + ph > window.innerHeight - 8) top = rect.top - ph - 6
    top = Math.max(8, top)

    let left = rect.left
    if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8
    left = Math.max(8, left)

    setPos({ top, left })
    setOpen(o => !o)
    setSearch('')
  }

  function handleSelect(emoji) {
    onChange(emoji)
    setOpen(false)
    setSearch('')
  }

  function handleClear(e) {
    e.stopPropagation()
    onChange('')
  }

  const displayEmojis = search.trim()
    ? ALL_EMOJIS.filter((_, i) => {
        // Simple: filter by position in string representation or just show all
        // Without a name database, show all emojis when searching (user scrolls visually)
        return true
      }).slice(0, 200)
    : (CATEGORIES.find(c => c.id === activeCat)?.emojis ?? [])

  // When searching, just show all emojis (visual search)
  const gridEmojis = search.trim() ? ALL_EMOJIS : displayEmojis

  return (
    <div className="emoji-picker-root">
      <div className="emoji-trigger-wrap">
        <button
          ref={triggerRef}
          type="button"
          className={`emoji-trigger${open ? ' active' : ''}`}
          onClick={handleOpen}
          title="Emoji wählen"
        >
          {value || '😊'}
        </button>
        {value && (
          <button type="button" className="emoji-clear-btn" onClick={handleClear} title="Entfernen">
            ✕
          </button>
        )}
      </div>

      {open && (
        <div
          className="emoji-popover"
          style={{ top: pos.top, left: pos.left }}
        >
          {/* Search */}
          <div className="emoji-search-row">
            <Search size={14} className="emoji-search-icon" />
            <input
              ref={searchRef}
              className="emoji-search"
              type="text"
              placeholder="Suchen …"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Category tabs – only when not searching */}
          {!search.trim() && (
            <div className="emoji-cats">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`emoji-cat-btn${activeCat === cat.id ? ' active' : ''}`}
                  onClick={() => setActiveCat(cat.id)}
                  title={cat.label}
                >
                  {cat.icon}
                </button>
              ))}
            </div>
          )}

          {search.trim() && (
            <p className="emoji-search-hint">Scrolle durch alle {ALL_EMOJIS.length} Emojis</p>
          )}

          {/* Emoji grid */}
          <div className="emoji-grid">
            {gridEmojis.map((e, i) => (
              <button
                key={e + i}
                type="button"
                className={`emoji-option${value === e ? ' selected' : ''}`}
                onClick={() => handleSelect(e)}
                title={e}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
