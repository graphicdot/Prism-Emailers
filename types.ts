export interface Template {
  id: string;
  name: string;
  content: string; // HTML string
  isUserUploaded?: boolean;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
}

export interface AppSettings {
  imgbbApiKey?: string;
}

export interface SelectedElement {
  tagName: string;
  text?: string;
  src?: string;
  href?: string;
  alt?: string;
  objectFit?: string;
  objectPosition?: string;
  transformOrigin?: string;
  scale?: number;
  styleHeight?: string;
  computedHeight?: string;
  styleWidth?: string;
  computedWidth?: string;
  xpath: string; // Unique identifier path
}

export enum AiActionType {
  REWRITE_FRIENDLY = 'REWRITE_FRIENDLY',
  REWRITE_PROFESSIONAL = 'REWRITE_PROFESSIONAL',
  SHORTEN = 'SHORTEN',
  FIX_GRAMMAR = 'FIX_GRAMMAR',
  GENERATE_ALT = 'GENERATE_ALT'
}