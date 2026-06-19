# Portrait Photographer Portfolio

A professional, performance-optimized portfolio website for portrait photographers. Built with React, TypeScript, and Tailwind CSS, featuring a custom filmstrip gallery with keyboard navigation, lazy loading, and comprehensive accessibility support.

## 🚀 Features

### Core Gallery Experience
- **Filmstrip Gallery** - Horizontal scrolling gallery with click-to-center interaction
- **Keyboard Navigation** - Arrow keys (left/right), Home, End keys for navigation
- **Auto-Advance** - Optional slideshow mode with pause on hover/focus (4.5 second intervals)
- **Touch-Optimized** - Native touch scrolling with momentum on mobile devices
- **IntersectionObserver** - Automatic active image detection during manual scrolling

### Performance Optimization
- **Lazy Loading** - Eager loading for first 3 images, lazy loading for others with IntersectionObserver
- **Responsive Images** - srcSet with multiple sizes (800w, 1200w, 1600w)
- **Code Splitting** - Route-based lazy loading with React.lazy() and Suspense
- **Hardware Acceleration** - CSS transforms for smooth 60fps scrolling
- **Loading Skeletons** - Animated placeholders during image load
- **Preconnect** - DNS prefetching for image CDN

### Accessibility (WCAG 2.1 AA Compliant)
- **Screen Reader Support** - ARIA labels, live regions, semantic HTML
- **Keyboard-Only Navigation** - Full functionality without mouse
- **Focus Management** - Visible focus indicators on all interactive elements
- **Touch Targets** - Minimum 44×44px for all buttons
- **Reduced Motion** - Respects prefers-reduced-motion media query
- **Color Contrast** - 4.5:1 minimum for text, 7:1 for captions

### SEO Optimization
- **Meta Tags** - Unique title and description per page
- **Open Graph** - Social media sharing optimization
- **Twitter Cards** - Rich previews on Twitter
- **Structured Data** - JSON-LD schemas for Person, ImageGallery, ImageObject
- **Sitemap.xml** - Complete site structure for search engines
- **Robots.txt** - Search engine crawling instructions
- **Semantic HTML** - Proper use of header, nav, main, article, figure tags

### Design System
- **Clean Editorial Aesthetic** - Pure white background, true black text
- **Typography** - Playfair Display (serif) + Inter (sans-serif)
- **Responsive Layout** - Mobile-first design with clamp() functions
- **Gray Scale Hierarchy** - 7 shades for visual depth
- **Design Tokens** - CSS custom properties for consistency

## 📁 Project Structure

```
src/
├── components/
│   ├── gallery/          # Gallery components
│   ├── layout/           # Navigation, footer, layout wrapper
│   ├── about/            # About page layout
│   └── seo/              # SEO meta tags component
├── pages/                # Route pages
├── context/              # React context for global state
├── hooks/                # Custom React hooks
├── types/                # TypeScript interfaces
└── data/                 # JSON data files
```

## 🛠 Development

### Prerequisites
- Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Getting Started

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Technologies Used
- **React 18** with TypeScript
- **Vite** for fast builds
- **Tailwind CSS v4** for styling
- **React Router v6** for routing
- **Lucide React** for icons

## 📝 Content Management

### Adding a New Series

1. Create JSON file in `public/data/series/[series-name].json`
2. Add route in `App.tsx`
3. Add navigation link in `HeaderNavigation.tsx`

### Updating Photographer Profile

Edit `public/data/photographer.json`:
- Name, tagline, biography
- Client lists
- Contact information
- Portrait image URL

## 🎯 Performance Targets

- **LCP**: <2.5s
- **FID**: <100ms
- **CLS**: <0.1
- **Lighthouse**: 90+ all categories

## 🚀 Deployment

### Via Lovable
Simply open [Lovable](https://lovable.dev/projects/6fd12b81-631e-49d3-83b3-86e8b3fab3ae) and click Share → Publish

### Manual Deployment
Build files in `dist/` can be deployed to Vercel, Netlify, AWS S3, or any static host.

**Before deploying:**
- Update `public/sitemap.xml` with your domain
- Update `public/robots.txt` with your domain
- Replace placeholder images with actual photography
- Update photographer name and branding throughout

## 🌐 Custom Domain

Navigate to Project > Settings > Domains in Lovable and click Connect Domain.

[Learn more about custom domains](https://docs.lovable.dev/features/custom-domain#custom-domain)

## 📊 Browser Support

- Chrome/Edge - Latest 2 versions
- Firefox - Latest 2 versions
- Safari (desktop + iOS) - Latest 2 versions
- Samsung Internet - Latest version

---

**Project URL**: https://lovable.dev/projects/6fd12b81-631e-49d3-83b3-86e8b3fab3ae

Built with [Lovable](https://lovable.dev) ❤️
