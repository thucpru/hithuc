import { Mail } from 'lucide-react';
import { Profile } from '@/types/content';
import { useT } from '@/context/LanguageContext';
import { Markdown } from '@/components/content/Markdown';

interface AboutPageLayoutProps {
  profile: Profile;
}

export function AboutPageLayout({ profile }: AboutPageLayoutProps) {
  const t = useT();

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12">
          {/* Left: bio */}
          <div className="lg:col-span-3 flex flex-col">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-[2.25rem] font-bold text-foreground">
              {profile.name}
            </h1>
            <p className="mt-2 text-base sm:text-lg text-gray-700">{t(profile.tagline)}</p>

            <div className="mt-8">
              <Markdown>{t(profile.bio)}</Markdown>
            </div>

            {/* Contact */}
            <section className="border-t border-gray-200 pt-6 sm:pt-8 mt-10">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                  <a
                    href={`mailto:${profile.contact.email}`}
                    className="text-sm sm:text-base text-gray-700 hover:text-foreground transition-colors"
                  >
                    {profile.contact.email}
                  </a>
                </div>
              </div>

              {profile.socials.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-4 text-sm">
                  {profile.socials.map((social) => (
                    <li key={social.url}>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-700 underline hover:text-foreground"
                      >
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right: avatar */}
          <div className="lg:col-span-2">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-full h-auto rounded-sm shadow-sm"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
