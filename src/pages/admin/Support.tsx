import { HeadphonesRound, Letter, ChatRound, Globus } from "@solar-icons/react"

interface SupportContact {
  name: string
  role: string
  channels: { label: string; href: string; icon: typeof Letter }[]
}

const CONTACTS: SupportContact[] = [
  {
    name: "Idighekere Udo",
    role: "Frontend Engineer",
    channels: [
      {
        label: "WhatsApp +234 704 130 0445",
        href: "https://wa.me/2347041300445",
        icon: ChatRound,
      },
      {
        label: "x.com/idighekere",
        href: "https://x.com/idighekere",
        icon: Globus,
      },
      {
        label: "idighekereudo@gmail.com",
        href: "mailto:idighekereudo@gmail.com",
        icon: Letter,
      },
    ],
  },
  {
    name: "Abasiofon Sendan",
    role: "Backend Engineer",
    channels: [
      {
        label: "t.me/abasiofonsendan",
        href: "https://t.me/abasiofonsendan",
        icon: ChatRound,
      },
      {
        label: "abasiofon135@gmail.com",
        href: "mailto:abasiofon135@gmail.com",
        icon: Letter,
      },
    ],
  },
]

export default function AdminSupport() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 pt-4 sm:pt-8 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 mb-1 sm:mb-2">
          Support
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500">
          Need help with Availlo? Reach out to any of us directly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CONTACTS.map((contact) => (
          <div
            key={contact.name}
            className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                <HeadphonesRound className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{contact.name}</h2>
                <p className="text-sm text-slate-500">{contact.role}</p>
              </div>
            </div>
            <div className="space-y-3">
              {contact.channels.map((channel) => (
                <a
                  key={channel.href}
                  href={channel.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  <channel.icon className="w-5 h-5 text-slate-400" />
                  {channel.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
