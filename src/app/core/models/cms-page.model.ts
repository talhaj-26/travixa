export type CmsPageStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export interface CmsPage {
  id: number;
  slug: string;
  title: string;
  content: string;
  languageId: number;
  status: CmsPageStatus;
  publishedAt: string | null;
}

export interface CmsPageRequest {
  slug: string;
  title: string;
  content: string;
  languageId: number;
  status: CmsPageStatus;
}

export interface CmsLanguage {
  id: number;
  code: string;
  displayName: string;
  nativeName: string;
  defaultLanguage: boolean;
}
