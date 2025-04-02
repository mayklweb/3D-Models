"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Layers3, LayoutGrid } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Models",
      href: "/dashboard/models",
      icon: <Layers3 className="h-5 w-5 mr-2" />,
    },
    {
      name: "Categories",
      href: "/dashboard/categories",
      icon: <LayoutGrid className="h-5 w-5 mr-2" />,
    },
  ]

  return (
    <nav className="flex flex-col space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-100",
            pathname === item.href || pathname.startsWith(`${item.href}/`)
              ? "bg-gray-100 font-semibold"
              : "text-gray-700",
          )}
        >
          {item.icon}
          {item.name}
        </Link>
      ))}
    </nav>
  )
}

