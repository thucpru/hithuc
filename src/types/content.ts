import { GalleryImage } from './gallery';

/** Supported UI languages. */
export type Lang = 'vi' | 'en';

/** A piece of text available in both site languages. */
export interface Localized {
  vi: string;
  en: string;
}

export type ProjectType = 'web' | 'app' | 'design';

export interface ProjectLinks {
  live?: string;
  repo?: string;
  store?: string;
}

export interface Project {
  id: string;
  slug: string;
  type: ProjectType;
  title: Localized;
  summary: Localized;
  /** Long-form description, markdown. */
  description: Localized;
  coverImage: string;
  gallery: GalleryImage[];
  tags: string[];
  role?: string;
  year?: string;
  stack?: string[];
  links?: ProjectLinks;
  featured?: boolean;
  /** Lower numbers sort first. */
  order?: number;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  tagline: Localized;
  /** Markdown bio. */
  bio: Localized;
  avatar: string;
  socials: SocialLink[];
  contact: {
    email: string;
    phone?: string;
  };
}

export interface Post {
  slug: string;
  title: Localized;
  excerpt: Localized;
  /** Markdown body. */
  body: Localized;
  cover?: string;
  tags: string[];
  publishedAt: string;
  status: 'draft' | 'published';
}

export const PROJECT_TYPES: ProjectType[] = ['web', 'app', 'design'];

export function isProjectType(value: string): value is ProjectType {
  return (PROJECT_TYPES as string[]).includes(value);
}
