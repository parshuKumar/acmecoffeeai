const MENU = [
  { name: "House Espresso", price: "$3.50", note: "Double shot, our own roast" },
  { name: "Oat Milk Latte", price: "$5.25", note: "Silky and balanced" },
  { name: "Cold Brew", price: "$4.75", note: "Steeped 18 hours" },
  { name: "Cinnamon Roll", price: "$4.00", note: "Baked fresh each morning" },
  { name: "Avocado Toast", price: "$8.50", note: "Sourdough, chili flake" },
];

const HOURS = [
  { day: "Monday – Friday", time: "6:30am – 6:00pm" },
  { day: "Saturday – Sunday", time: "7:00am – 4:00pm" },
];

const BADGES = ["🐾 Dog-friendly patio", "📶 Free wifi", "☕ Roasted in-house every Tuesday"];

function CupMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path
        d="M14 24h30v16a15 15 0 0 1-15 15v0a15 15 0 0 1-15-15V24Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M44 28h4a7 7 0 0 1 0 14h-4"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 18c1-3-1-4-1-7M28 18c1-3-1-4-1-7M36 18c1-3-1-4-1-7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-latte/40 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-2 font-display text-xl font-semibold">
            <CupMark className="h-6 w-6 text-coffee" />
            Acme Coffee
          </a>
          <nav aria-label="Primary" className="hidden gap-8 text-sm font-medium sm:flex">
            <a className="hover:text-coffee" href="#menu">
              Menu
            </a>
            <a className="hover:text-coffee" href="#hours">
              Hours &amp; Location
            </a>
            <a className="hover:text-coffee" href="#catering">
              Catering
            </a>
          </nav>
          <a
            href="tel:+15552108842"
            className="rounded-full bg-coffee px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-espresso"
          >
            (555) 210-8842
          </a>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <div className="grid items-center gap-12 sm:grid-cols-2">
            <div>
              <p className="mb-3 font-medium uppercase tracking-widest text-coffee">
                Maple Street, Riverside
              </p>
              <h1 className="text-balance font-display text-4xl font-semibold leading-tight sm:text-5xl">
                Small-batch coffee, roasted a few feet from where you&apos;ll drink it.
              </h1>
              <p className="mt-5 max-w-md text-lg text-espresso/80">
                A neighborhood spot for espresso, pastries, and a patio your dog is welcome on.
                Open every day.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#menu"
                  className="rounded-full bg-coffee px-6 py-3 font-semibold text-cream transition-colors hover:bg-espresso"
                >
                  See the menu
                </a>
                <a
                  href="#hours"
                  className="rounded-full border-2 border-coffee px-6 py-3 font-semibold text-coffee transition-colors hover:bg-coffee hover:text-cream"
                >
                  Hours &amp; location
                </a>
              </div>
            </div>
            <div className="rounded-3xl bg-cream-dark p-10 shadow-sm">
              <CupMark className="mx-auto h-32 w-32 text-coffee" />
              <dl className="mt-8 space-y-3 text-sm">
                {HOURS.map((h) => (
                  <div key={h.day} className="flex justify-between gap-4">
                    <dt className="font-medium text-espresso/70">{h.day}</dt>
                    <dd className="font-semibold">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <ul className="mt-14 flex flex-wrap gap-3">
            {BADGES.map((b) => (
              <li
                key={b}
                className="rounded-full bg-cream-dark px-4 py-2 text-sm font-medium text-espresso/80"
              >
                {b}
              </li>
            ))}
          </ul>
        </section>

        {/* Menu */}
        <section id="menu" className="border-t border-latte/40 bg-cream-dark/50 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="font-display text-3xl font-semibold">Menu highlights</h2>
            <p className="mt-2 text-espresso/70">A few of what people order most.</p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {MENU.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-latte/40 bg-cream p-6 shadow-sm"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold">{item.name}</h3>
                    <span className="font-semibold text-coffee">{item.price}</span>
                  </div>
                  <p className="mt-2 text-sm text-espresso/70">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hours & Location */}
        <section id="hours" className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-5xl gap-10 px-6 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-semibold">Hours</h2>
              <dl className="mt-6 space-y-3">
                {HOURS.map((h) => (
                  <div key={h.day} className="flex justify-between border-b border-latte/30 pb-3">
                    <dt className="text-espresso/70">{h.day}</dt>
                    <dd className="font-semibold">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h2 className="font-display text-3xl font-semibold">Find us</h2>
              <address className="mt-6 space-y-2 not-italic text-espresso/80">
                <p>214 Maple Street, Riverside</p>
                <p>
                  <a className="underline hover:text-coffee" href="tel:+15552108842">
                    (555) 210-8842
                  </a>
                </p>
                <p className="text-sm text-espresso/60">
                  Free street parking, plus a small 6-spot lot behind the building.
                </p>
              </address>
            </div>
          </div>
        </section>

        {/* Catering & gift cards */}
        <section id="catering" className="border-t border-latte/40 bg-cream-dark/50 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="font-display text-3xl font-semibold">Catering &amp; gift cards</h2>
            <div className="mt-6 grid gap-8 sm:grid-cols-2">
              <p className="text-espresso/80">
                We don&apos;t deliver, but we do cater groups of 10 or more — just give us 48
                hours&apos; notice.
              </p>
              <p className="text-espresso/80">
                Gift cards are available in-store only, cash or card. Online gift card sales are
                coming soon.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-latte/40 py-10">
        <div className="mx-auto max-w-5xl px-6 text-sm text-espresso/60">
          <p>© {new Date().getFullYear()} Acme Coffee · 214 Maple Street, Riverside</p>
        </div>
      </footer>
    </div>
  );
}
