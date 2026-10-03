"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Pregled" },
  { href: "/zaposleni", label: "Zaposleni" },
  { href: "/radna-mesta", label: "Radna mesta" },
  { href: "/lekarski-pregledi", label: "Lekarski pregledi" },
  { href: "/obuke", label: "Obuke" },
  { href: "/lzo", label: "LZO" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1">
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-1.5 text-sm ${
              active ? "bg-blue-50 font-medium text-blue-800" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
