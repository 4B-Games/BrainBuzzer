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

// Comprehensive keyword map – German + English
const _KW = {
  // Gesten & Hände
  '👍':'daumen hoch thumbs up gut ok super toll ja genial prima',
  '👎':'daumen runter thumbs down schlecht nein ablehnen',
  '👋':'winken hallo hi hello wave tschüss bye',
  '🤚':'hand stop halt five',
  '🖐️':'hand stop halt five finger',
  '✋':'hand stop halt',
  '🖖':'spock vulkan grüßen',
  '👌':'okay ok perfect prima alles gut',
  '🤌':'fingerkuppe italien perfect',
  '🤏':'klein bisschen little tiny',
  '✌️':'frieden peace sieg victory zwei fingers',
  '🤞':'daumen finger glück luck kreuzen cross',
  '🫰':'fingerschnipsen snap',
  '🤟':'liebe love hang loose',
  '🤘':'rock metal horn',
  '🤙':'anruf call shaka',
  '👈':'links left zeigen pointing',
  '👉':'rechts right zeigen pointing',
  '👆':'oben up zeigen pointing',
  '🖕':'mittelfinger finger',
  '👇':'unten down zeigen pointing',
  '☝️':'oben one zeigen pointing',
  '🫵':'du you zeigen pointing',
  '👍':'daumen hoch thumbs up gut',
  '✊':'faust punch power solidarity',
  '👊':'faust punch schlag hit',
  '🤛':'faust left punch',
  '🤜':'faust right punch',
  '👏':'klatschen applaus clap bravo',
  '🙌':'hurra hände high five juhu yeah',
  '🫶':'herz hände love heart',
  '🤲':'bitte please bitten',
  '🤝':'handshake partner agreement vereinbarung meeting',
  '🙏':'bitte danke danken pray beten please thank',
  '💪':'muskel arm stark strong muscle bicep',
  '🦾':'roboterarm cyber strong',
  // Smileys
  '😀':'lachen smiley happy glücklich',
  '😃':'lachen happy freude joy',
  '😄':'lachen happy smile',
  '😁':'grinsen grin',
  '😆':'lachen laugh',
  '😅':'schweiß sweat lachen',
  '🤣':'lachen laugh',
  '😂':'tränen lachen cry laugh',
  '🙂':'lächeln smile',
  '🙃':'upside down flip',
  '😉':'zwinkern wink',
  '😊':'lächeln smile warm',
  '😇':'engel angel heiligenschein halo',
  '🥰':'verliebt liebe love hearts',
  '😍':'verliebt love augen eyes',
  '🤩':'begeistert stern star eyes wow',
  '😘':'kuss kiss',
  '😎':'cool sonnenbrille sunglasses',
  '🤓':'nerd brille glasses geek',
  '🥳':'party feiern celebrate geburtstag birthday',
  '😒':'genervt annoyed',
  '😔':'traurig sad',
  '😢':'weinen cry tear',
  '😭':'weinen cry sobbing',
  '😤':'wütend angry proud',
  '😠':'wütend angry mad',
  '😡':'wütend angry',
  '🤬':'fluchen curse angry',
  '😱':'schock shocked entsetzt',
  '😴':'schlafen sleep müde tired',
  '🤔':'nachdenken thinking überlegen',
  '🤫':'psst still quiet',
  '🤭':'ups oops hände mund',
  '😐':'neutral',
  '😑':'ausdruckslos expressionless',
  '🤐':'mund mouth zip quiet',
  '🥴':'schwindelig woozy',
  '😵':'schwindelig dizzy',
  '🤯':'explodiert mind blown',
  '🤢':'übel krank sick nauseous',
  '🤮':'erbrechen sick',
  '🤧':'niesen sneeze krank sick',
  '😷':'maske mask krank sick',
  // Herzen & Symbole
  '❤️':'herz liebe love heart rot red',
  '🧡':'orange herz heart',
  '💛':'gelb herz heart yellow',
  '💚':'grün herz heart green',
  '💙':'blau herz heart blue',
  '💜':'lila herz heart purple',
  '🖤':'schwarz herz heart black',
  '🤍':'weiß herz heart white',
  '🤎':'braun herz heart brown',
  '💔':'gebrochenes herz broken heart',
  '❣️':'herz ausrufezeichen heart',
  '💕':'zwei herzen hearts',
  '💞':'herzen spin hearts',
  '💓':'herz beat heart',
  '💗':'wachsendes herz heart',
  '💖':'funkelnd herz heart sparkle',
  '💘':'amor herz heart arrow',
  '💝':'herz schleife heart ribbon',
  // Tech & Arbeit
  '🖥️':'computer bildschirm desktop monitor',
  '💻':'laptop notebook computer',
  '📱':'handy phone smartphone mobile',
  '⌨️':'tastatur keyboard tippen typing',
  '🖱️':'maus mouse klicken click',
  '🖨️':'drucker printer drucken print',
  '💾':'diskette floppy speichern save',
  '💿':'cd disc',
  '📀':'dvd disc',
  '📷':'kamera camera foto photo',
  '📸':'selfie kamera foto',
  '📹':'video kamera',
  '🎥':'film kamera camera',
  '📺':'fernseher tv television',
  '📻':'radio',
  '🧭':'kompass compass navigation',
  '⏱️':'stoppuhr timer stopwatch',
  '⏲️':'küchentimer timer',
  '⏰':'wecker alarm clock uhr zeit time',
  '🕰️':'uhr clock Zeit',
  '⌛':'sanduhr hourglass time',
  '⏳':'sanduhr hourglass time loading',
  '📡':'antenne satellite signal',
  '🔋':'batterie battery energie energy',
  '🔌':'stecker plug',
  '💡':'idee idea glühbirne lamp light',
  '🔦':'taschenlampe flashlight',
  '🕯️':'kerze candle',
  // Büro & Schule
  '📊':'diagramm chart statistik statistics balken bar',
  '📈':'steigung wachstum trend chart up',
  '📉':'rückgang trend chart down',
  '📋':'klemmbrett clipboard liste list',
  '📝':'notiz notizen note schreiben write',
  '✏️':'stift pencil schreiben write',
  '🖊️':'kugelschreiber stift pen',
  '🖋️':'füllfeder pen',
  '🖌️':'pinsel brush malen paint',
  '🖍️':'stift crayon',
  '📌':'pin nadel push pin',
  '📍':'pin ort location',
  '📎':'büroklammer paperclip',
  '🖇️':'büroklammern clips',
  '📏':'lineal ruler',
  '📐':'winkel ruler set square',
  '✂️':'schere scissors schneiden cut',
  '🗃️':'kartei karteikarte box',
  '🗄️':'aktenschrank filing cabinet',
  '🗑️':'mülleimer trash delete',
  '🔒':'schloss lock gesperrt',
  '🔓':'schloss offen unlock',
  '🔐':'schloss schlüssel lock key',
  '🔑':'schlüssel key',
  '🗝️':'alter schlüssel key',
  '🔨':'hammer',
  '⚒️':'hammer werkzeug tools',
  '🛠️':'werkzeug tools',
  '⛏️':'spitzhacke pick',
  '🔩':'schraube screw',
  '🪛':'schraubenzieher screwdriver',
  '🔧':'schraubenschlüssel wrench werkzeug tool',
  '⚙️':'einstellungen settings zahnrad gear',
  '🔗':'link kette chain',
  '🪝':'haken hook',
  '🧱':'ziegel brick',
  '🔬':'mikroskop microscope labor science',
  '🔭':'teleskop telescope',
  '📡':'antenne satellite',
  '🩺':'stethoskop arzt doctor',
  '💊':'pille tablette pill',
  '💉':'spritze injection',
  '🧬':'dna bio genetik',
  '🧪':'labor test reagenzglas',
  '🌡️':'thermometer temperatur',
  '🪤':'falle trap',
  '🧰':'werkzeugkasten toolbox',
  '🗜️':'schraubstock clamp',
  '📅':'kalender calendar datum date',
  '📆':'kalender calendar',
  '🗓️':'kalender planer calendar',
  '📇':'kartei index card',
  '📋':'liste list',
  '📓':'notizbuch notebook',
  '📔':'notizbuch notebook',
  '📒':'notizbuch notebook',
  '📕':'buch book rot red',
  '📗':'buch book grün green',
  '📘':'buch book blau blue',
  '📙':'buch book orange',
  '📚':'bücher books lesen learning',
  '📖':'buch book lesen read',
  '🔖':'lesezeichen bookmark',
  '💬':'nachricht chat message bubble',
  '💭':'gedanke thought bubble',
  '🗯️':'ausruf shout bubble',
  '📣':'megafon megaphone ankündigung',
  '📢':'lautsprecher speaker announcement',
  '🔔':'glocke bell',
  '🔕':'glocke aus bell off',
  '🔇':'stummgeschaltet mute',
  '🔈':'lautsprecher speaker low',
  '🔉':'lautsprecher speaker',
  '🔊':'lautsprecher laut speaker loud',
  '🎵':'musik music note',
  '🎶':'noten musik notes',
  '📦':'paket box lieferung package delivery',
  '📫':'briefkasten mailbox',
  '📬':'briefkasten mailbox',
  '📮':'briefkasten mailbox',
  '✉️':'brief email letter',
  '📧':'email',
  '🔍':'suche search lupe magnify',
  '🔎':'suche search lupe',
  '📁':'ordner folder',
  '🗂️':'ordner folder',
  '💼':'koffer tasche business job arbeit work',
  '👔':'hemd shirt krawatte tie business',
  '💰':'geld money euro dollar cash',
  '💵':'dollar geld money',
  '💶':'euro geld money',
  '💳':'kreditkarte card zahlung payment',
  '🪙':'münze coin',
  // Natur & Wetter
  '☀️':'sonne sun sonnig sunny',
  '🌤️':'sonne wolke partly cloudy',
  '⛅':'wolke sonne cloudy',
  '☁️':'wolke cloud',
  '🌧️':'regen rain',
  '⛈️':'gewitter thunderstorm',
  '🌩️':'blitz lightning',
  '🌨️':'schnee snow',
  '❄️':'eis ice schnee snow kalt cold',
  '☃️':'schneemann snowman',
  '⛄':'schneemann snowman',
  '🌬️':'wind',
  '💧':'tropfen water drop',
  '💦':'wasser water',
  '🌊':'wellen wave ocean meer',
  '🌀':'wirbel spiral',
  '🌪️':'tornado twister',
  '🔥':'feuer fire hot brennen',
  '⚡':'blitz lightning schnell fast elektrizität',
  '🌈':'regenbogen rainbow',
  '🌙':'mond moon nacht night',
  '⭐':'stern star',
  '🌟':'stern star glänzend',
  '✨':'glitzer sparkle funken',
  '💫':'stern star',
  '☄️':'komet comet',
  '🪐':'planet saturn',
  // Essen
  '☕':'kaffee coffee',
  '🫖':'tee tea',
  '🍵':'tee tea grün green',
  '🧃':'saft juice',
  '🥤':'getränk drink',
  '🧋':'bubble tea boba',
  '🍺':'bier beer',
  '🍷':'wein wine rot red',
  '🥂':'sekt champagne anstoßen toast',
  '🍾':'champagner feiern celebrate',
  '🍹':'cocktail',
  '🍸':'cocktail',
  '🍕':'pizza',
  '🍔':'burger',
  '🍟':'pommes frites chips',
  '🌮':'taco',
  '🌯':'wrap',
  '🥗':'salat salad',
  '🍱':'bento lunch box',
  '🍣':'sushi',
  '🍎':'apfel apple rot',
  '🍊':'orange mandarine',
  '🍋':'zitrone lemon',
  '🍇':'trauben grapes',
  '🍓':'erdbeere strawberry',
  '🎂':'geburtstagskuchen cake birthday',
  '🍰':'kuchen cake',
  '🍩':'donut',
  '🍪':'keks cookie',
  '🍫':'schokolade chocolate',
  '🍬':'süßigkeit candy',
  '🍭':'lutscher lollipop',
  '🍯':'honig honey',
  // Transport
  '🚗':'auto car fahrzeug vehicle',
  '🚕':'taxi',
  '🚙':'suv auto car',
  '🚌':'bus',
  '🚎':'obus trolleybus',
  '🏎️':'rennauto race car',
  '🚓':'polizeiauto police',
  '🚑':'krankenwagen ambulance',
  '🚒':'feuerwehr fire truck',
  '🚚':'lkw truck',
  '🛻':'pickup truck',
  '🏍️':'motorrad motorcycle',
  '🛵':'roller scooter',
  '🚲':'fahrrad bike bicycle',
  '🛴':'tretroller scooter',
  '✈️':'flugzeug fliegen reise travel plane',
  '🛩️':'flugzeug plane',
  '🚀':'rakete rocket',
  '🛸':'ufo raumschiff',
  '🚢':'schiff ship',
  '⛵':'segelboot sailboat',
  '🛥️':'motorboot',
  '🚤':'speedboot',
  '🚂':'zug train bahn',
  '🚃':'waggon train',
  '🚄':'hochgeschwindigkeit schnellzug fast train',
  '🚅':'shinkansen schnellzug bullet train',
  '🚇':'u-bahn metro subway',
  '🏠':'haus home zuhause house',
  '🏡':'haus garden home',
  '🏢':'büro office gebäude building',
  '🏦':'bank',
  '🏥':'krankenhaus hospital',
  '🏨':'hotel',
  '🏪':'geschäft store shop',
  '🏫':'schule school',
  '🏬':'kaufhaus mall',
  // Sport & Aktivitäten
  '⚽':'fußball soccer',
  '🏀':'basketball',
  '🏈':'american football',
  '⚾':'baseball',
  '🎾':'tennis',
  '🏐':'volleyball',
  '🏉':'rugby',
  '🎱':'billard pool',
  '🏓':'tischtennis ping pong',
  '🏸':'badminton',
  '⛳':'golf',
  '🎣':'angeln fishing',
  '🤿':'tauchen diving',
  '🥊':'boxen boxing',
  '🥋':'kampfsport martial arts',
  '🏆':'pokal trophy gewinner winner',
  '🥇':'gold erste first',
  '🥈':'silber silver zweite second',
  '🥉':'bronze dritte third',
  '🏅':'medaille medal',
  '🎖️':'auszeichnung medal honor',
  '🎗️':'schleife ribbon',
  '🎫':'ticket eintrittskarte',
  '🎟️':'ticket eintrittskarte',
  '🎪':'zirkus circus',
  '🤹':'jonglieren juggling',
  '🎭':'theater drama',
  '🎨':'kunst art design farbe color',
  '🖼️':'bild picture rahmen frame',
  '🎬':'film kino kamera clapperboard',
  '🎤':'mikrofon microphone singen sing',
  '🎧':'kopfhörer headphones',
  '🎼':'noten musik score',
  '🎵':'musik music note',
  '🎶':'noten musik notes',
  '🎷':'saxophon saxophone',
  '🪗':'akkordeon accordion',
  '🎸':'gitarre guitar',
  '🎹':'klavier piano',
  '🎺':'trompete trumpet',
  '🎻':'geige violin',
  '🪕':'banjo',
  '🥁':'schlagzeug drum',
  '🪘':'trommel drum',
  '🎲':'würfel dice spiel game',
  '♟️':'schach chess',
  '🎯':'ziel target darts treffer',
  '🎳':'bowling',
  '🎮':'controller spielen gaming',
  '🎰':'spielautomat slot machine',
  '🧩':'puzzle',
  '🧸':'teddybär teddy bear',
  '🪅':'piñata',
  '🪆':'matrjoschka',
  // Symbole & Zeichen
  '✅':'haken check fertig done ok',
  '❌':'kreuz fehler error nein no',
  '❎':'kreuz fehler cross',
  '🛑':'stop halt',
  '⛔':'verboten no entry stop',
  '📛':'schild badge',
  '🚫':'verboten forbidden',
  '💯':'hundert perfect top',
  '💢':'wut anger',
  '♨️':'heiß hot dampf',
  '🔱':'dreizack trident',
  '⚜️':'lilie fleur de lis',
  '🔰':'anfänger beginner',
  '♻️':'recycling',
  '⚠️':'warnung warning',
  '🚸':'kinder children crossing',
  '🆚':'versus vs',
  '🆕':'neu new',
  '🆓':'kostenlos free',
  '🆒':'cool',
  '🆙':'up',
  '🆗':'ok',
  '🆘':'notfall sos emergency',
  '🅰️':'blutgruppe blood type a',
  '🅱️':'blutgruppe blood type b',
  '🅾️':'blutgruppe blood type o',
  '❓':'frage question',
  '❔':'frage question',
  '❕':'ausruf exclamation',
  '❗':'ausruf exclamation wichtig important',
  '©️':'copyright',
  '®️':'registriert registered',
  '™️':'marke trademark',
}
// Build keyword arrays
Object.keys(_KW).forEach(k => { _KW[k] = _KW[k].toLowerCase().split(' ') })
const EMOJI_KEYWORDS = _KW

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

  // Real search: filter by category name or per-emoji keywords
  const q = search.trim().toLowerCase()
  const gridEmojis = q
    ? CATEGORIES.flatMap(cat =>
        cat.emojis.filter(e =>
          cat.label.toLowerCase().includes(q) ||
          (EMOJI_KEYWORDS[e] ?? []).some(kw => kw.includes(q))
        )
      ).filter((e, i, arr) => arr.indexOf(e) === i)
    : (CATEGORIES.find(c => c.id === activeCat)?.emojis ?? [])

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

          {search.trim() && gridEmojis.length === 0 && (
            <p className="emoji-search-hint">Keine Treffer für „{search}"</p>
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
