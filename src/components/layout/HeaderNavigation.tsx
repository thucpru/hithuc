import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { useT } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PROJECT_TYPES } from "@/types/content";
import { TYPE_LABELS, UI_TEXT } from "@/lib/labels";

interface NavItem {
  to: string;
  label: string;
}

export function HeaderNavigation() {
  const { profile } = usePortfolio();
  const t = useT();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!profile) return null;

  const navItems: NavItem[] = [
    ...PROJECT_TYPES.map((type) => ({ to: `/work/${type}`, label: t(TYPE_LABELS[type]) })),
    { to: "/about", label: t(UI_TEXT.about) },
  ];

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const linkClass = (active: boolean) =>
    `transition-all duration-200 ${
      active ? "font-semibold text-foreground" : "font-normal text-muted-foreground hover:text-gray-700"
    }`;

  return (
    <div className="relative w-full">
      <div className="flex items-end justify-between mb-2">
        <div className="flex justify-between md:justify-start w-full md:w-fit md:flex-col gap-4">
          {/* Name */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="font-sans text-2xl sm:text-[2.1rem] lg:text-[2.4rem] leading-tight font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity">
              {profile.name}
            </h1>
          </Link>

          {/* Mobile: hamburger */}
          <div className="sm:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-2 -m-2 hover:opacity-70 transition-opacity"
                  aria-label="Open navigation menu"
                  aria-expanded={isMenuOpen}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-8">
                  <ul className="flex flex-col gap-6">
                    {navItems.map((item) => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onClick={() => setIsMenuOpen(false)}
                          className={`text-lg ${linkClass(isActive(item.to))}`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                    <li className="mt-8 pt-6 border-t flex flex-col gap-4">
                      <LanguageToggle />
                      <a
                        href={`mailto:${profile.contact.email}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        e: {profile.contact.email}
                      </a>
                    </li>
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Tablet/Desktop: horizontal nav */}
          <nav className="hidden sm:block">
            <ul className="flex flex-row flex-wrap items-center gap-4 sm:gap-5 lg:gap-6 text-sm sm:text-base lg:text-[1.0625rem]">
              {navItems.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={linkClass(isActive(item.to))}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <LanguageToggle />
              </li>
            </ul>
          </nav>
        </div>

        {/* Contact - desktop */}
        <div className="hidden md:flex flex-col items-end gap-1 text-sm lg:text-[0.9375rem] text-muted-foreground">
          <a href={`mailto:${profile.contact.email}`} className="hover:text-foreground transition-colors py-1">
            e: {profile.contact.email}
          </a>
          {profile.contact.phone && (
            <a href={`tel:${profile.contact.phone}`} className="hover:text-foreground transition-colors py-1">
              m: {profile.contact.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
