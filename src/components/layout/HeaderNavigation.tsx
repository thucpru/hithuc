import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function HeaderNavigation() {
  const { photographer, series } = usePortfolio();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!photographer) return null;

  const isActive = (path: string) => {
    // For home page
    if (path === "/" && location.pathname === "/") return true;
    // For other pages
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="relative w-full">
      {/* Top Row: Name + Contact Info */}
      <div className="flex items-end justify-between mb-2">
        <div className="flex justify-between md:justify-start w-full md:w-fit md:flex-col gap-4">
          {/* Title */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="font-sans text-2xl sm:text-[2.1rem] lg:text-[2.4rem] leading-tight font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity">
              {photographer.name}
            </h1>
          </Link>

          {/* Mobile: Hamburger Menu */}
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
                    {series.map((s) => (
                      <li key={s.id}>
                        <Link
                          to={`/series/${s.slug}`}
                          onClick={handleNavClick}
                          className={`text-lg transition-all duration-200 ${
                            isActive(`/series/${s.slug}`)
                              ? "font-semibold text-foreground"
                              : "font-normal text-muted-foreground hover:text-gray-700"
                          }`}
                        >
                          {s.title}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        to="/about"
                        onClick={handleNavClick}
                        className={`text-lg transition-all duration-200 ${
                          isActive("/about")
                            ? "font-semibold text-foreground"
                            : "font-normal text-muted-foreground hover:text-gray-700"
                        }`}
                      >
                        About
                      </Link>
                    </li>

                    {/* Contact info in mobile menu */}
                    <li className="mt-8 pt-6 border-t">
                      <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                        <a
                          href={`mailto:${photographer.contact.email}`}
                          className="hover:text-foreground transition-colors"
                        >
                          e: {photographer.contact.email}
                        </a>
                        <a
                          href={`tel:${photographer.contact.phone}`}
                          className="hover:text-foreground transition-colors"
                        >
                          m: {photographer.contact.phone}
                        </a>
                      </div>
                    </li>
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Tablet/Desktop: Horizontal Navigation */}
          <nav className="hidden sm:block">
            <ul className="flex flex-row flex-wrap gap-4 sm:gap-5 lg:gap-6">
              {series.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/series/${s.slug}`}
                    className={`text-sm sm:text-base lg:text-[1.0625rem] leading-[1.375rem] transition-all duration-200 ${
                      isActive(`/series/${s.slug}`)
                        ? "font-semibold text-foreground"
                        : "font-normal text-muted-foreground hover:text-gray-700"
                    }`}
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/about"
                  className={`text-sm sm:text-base lg:text-[1.0625rem] leading-[1.375rem] transition-all duration-200 ${
                    isActive("/about")
                      ? "font-semibold text-foreground"
                      : "font-normal text-muted-foreground hover:text-gray-700"
                  }`}
                >
                  About
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        {/* Contact Info - Tablet/Desktop Only */}
        <div className="hidden md:flex flex-col items-end gap-1 text-sm lg:text-[0.9375rem] text-muted-foreground">
          <a href={`mailto:${photographer.contact.email}`} className="hover:text-foreground transition-colors py-1">
            e: {photographer.contact.email}
          </a>
          <a href={`tel:${photographer.contact.phone}`} className="hover:text-foreground transition-colors py-1">
            m: {photographer.contact.phone}
          </a>
        </div>
      </div>

      {/* Bottom Row: Navigation */}
    </div>
  );
}
