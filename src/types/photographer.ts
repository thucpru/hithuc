export interface BiographyContent {
  philosophy: string;
  background: string;
  experience: string;
  currentFocus: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
}

export interface ClientCategory {
  category: string;
  clients: string[];
}

export interface PhotographerProfile {
  name: string;
  tagline: string;
  biography: BiographyContent;
  contact: ContactInfo;
  clients: ClientCategory[];
  portraitImage: {
    src: string;
    alt: string;
  };
}
