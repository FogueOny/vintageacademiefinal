"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { GraduationCap, Globe2, Monitor, BookOpen, Award, Users } from "lucide-react";

export const PUBLIC_LINKS = [
  { href: "/", label: "Accueil", external: false },
  { href: "https://tcf.vintageacademie.com", label: "TCF", external: true },
  { href: "https://ielts.vintageacademie.com", label: "IELTS", external: true },
  { href: "#", label: "Cours d'Allemand", external: false, disabled: true },
];

export function MainNavigation() {
  const pathname = usePathname();

  return (
    <NavigationMenu className="mx-auto">
      <NavigationMenuList className="flex justify-center items-center gap-2">
        {PUBLIC_LINKS.map((item) => (
          <NavigationMenuItem key={item.href}>
            {(item as any).disabled ? (
              <span
                className="inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed opacity-60"
              >
                {item.label}
              </span>
            ) : (item as any).external ? (
              <NavigationMenuLink asChild>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 focus:outline-none text-gray-600"
                >
                  {item.label}
                </a>
              </NavigationMenuLink>
            ) : (
              <NavigationMenuLink asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                    pathname === item.href ? "bg-orange-50 text-orange-600" : "text-gray-600"
                  )}
                >
                  {item.label}
                </Link>
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { icon?: React.ReactNode }
>(({ className, title, icon, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600",
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2">
            {icon}
            <div className="text-sm font-medium leading-none">{title}</div>
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
// Analyse le projet et faire un resumer de ce qui es fais et une aanlyse pour ceci : identifier pourquoi quand on es connecter, on ne peux pas faire des test de comprehension, la page charge a l'infinie exemple : http://localhost:3000/comprehension-orale pourtant sa respecte la logique lorsque on es un utilisateur sans compte.
//