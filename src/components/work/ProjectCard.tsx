import { Link } from 'react-router-dom';
import { Project } from '@/types/content';
import { useT } from '@/context/LanguageContext';

interface ProjectCardProps {
  project: Project;
}

/** A clickable project tile linking to its detail page. */
export function ProjectCard({ project }: ProjectCardProps) {
  const t = useT();

  return (
    <Link
      to={`/project/${project.slug}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 rounded-sm"
    >
      <div className="overflow-hidden rounded-sm bg-gray-100 aspect-[3/2]">
        <img
          src={project.coverImage}
          alt={t(project.title)}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif text-lg font-semibold text-foreground leading-tight">
            {t(project.title)}
          </h3>
          {project.year && (
            <span className="text-sm text-muted-foreground flex-shrink-0">{project.year}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-700 leading-snug line-clamp-2">{t(project.summary)}</p>
      </div>
    </Link>
  );
}
