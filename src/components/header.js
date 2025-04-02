import Link from "next/link"

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-white px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="font-semibold text-lg">
          AI Dashboard
        </Link>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <div className="font-medium text-lg">Dashboard</div>
      </div>
    </header>
  )
}

