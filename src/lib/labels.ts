import { Localized, ProjectType } from '@/types/content';

/** Display names for each project type, bilingual. */
export const TYPE_LABELS: Record<ProjectType, Localized> = {
  web: { vi: 'Web', en: 'Web' },
  app: { vi: 'App', en: 'App' },
  design: { vi: 'Thiết kế', en: 'Design' },
};

export const UI_TEXT = {
  allWork: { vi: 'Dự án', en: 'Work' },
  viewAll: { vi: 'Xem tất cả', en: 'View all' },
  about: { vi: 'Giới thiệu', en: 'About' },
  blog: { vi: 'Blog', en: 'Blog' },
  noProjects: { vi: 'Chưa có dự án nào.', en: 'No projects yet.' },
  role: { vi: 'Vai trò', en: 'Role' },
  year: { vi: 'Năm', en: 'Year' },
  stack: { vi: 'Công nghệ', en: 'Stack' },
  links: { vi: 'Liên kết', en: 'Links' },
  live: { vi: 'Xem trực tiếp', en: 'Live' },
  repo: { vi: 'Mã nguồn', en: 'Source' },
  store: { vi: 'Cửa hàng', en: 'Store' },
  prev: { vi: 'Trước', en: 'Previous' },
  next: { vi: 'Tiếp', en: 'Next' },
  loadError: { vi: 'Không tải được dữ liệu', en: 'Failed to load data' },
  retry: { vi: 'Thử lại', en: 'Retry' },
} satisfies Record<string, Localized>;
