import { usePortfolio } from '@/context/PortfolioContext';

export function Footer() {
  const { profile } = usePortfolio();

  if (!profile) return null;

  // Simple email obfuscation by replacing @ with [at]
  const obfuscateEmail = (email: string) => email.replace('@', '[at]');

  return (
    <div className="h-full flex items-center px-4 sm:px-8 lg:px-12 border-t border-gray-200 bg-background">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[0.8125rem] leading-4 text-gray-500">
          {/* Contact Links */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <a
              href={`mailto:${profile.contact.email}`}
              className="hover:text-gray-700 transition-colors"
              aria-label={`Email ${profile.name}`}
            >
              {obfuscateEmail(profile.contact.email)}
            </a>
            {profile.contact.phone && (
              <a
                href={`tel:${profile.contact.phone}`}
                className="hover:text-gray-700 transition-colors"
                aria-label={`Call ${profile.name}`}
              >
                {profile.contact.phone}
              </a>
            )}
          </div>

          {/* Copyright */}
          <p className="text-center sm:text-right">
            &copy; {new Date().getFullYear()} {profile.name}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
