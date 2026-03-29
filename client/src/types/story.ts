export type UserId = number;

export interface AssetImage {
  objectKey: string;
  url?: string;
  contentType?: string;
}

export interface Series {
  id: string;
  userId: UserId;
  title: string;
  description?: string;
  icon?: AssetImage;
  createdAt: number;
  updatedAt: number;
}

export interface Book {
  id: string;
  userId: UserId;
  seriesId: string;
  rank: string;
  title: string;
  author?: string;
  publishDate?: string;
  isbn?: string;
  coverImage?: AssetImage;
  hasChapters: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Chapter {
  id: string;
  userId: UserId;
  seriesId: string;
  bookId: string;
  rank: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SceneDerived {
  title?: string;
  chapter?: string | number;
  section?: string;
  bookRank?: string;
  timelineRank?: string;
  timelineIds?: string[];
  locationId?: string;
  characterIds?: string[];
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

export interface Scene {
  id: string;
  userId: UserId;
  seriesId: string;
  bookId: string;
  chapterId?: string;
  rank: string;
  text: string;
  derived: SceneDerived;
  createdAt: number;
  updatedAt: number;
}

export type FieldType = "text" | "number" | "textarea" | "select" | "list";

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
}

export interface CharacterType {
  id: string;
  userId: UserId;
  seriesId: string;
  name: string;
  description?: string;
  fields: FieldDefinition[];
  createdAt: number;
  updatedAt: number;
}

export interface Character {
  id: string;
  userId: UserId;
  seriesId: string;
  name: string;
  description?: string;
  image?: AssetImage;
  characterTypeId?: string;
  typeData?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface Location {
  id: string;
  userId: UserId;
  seriesId: string;
  name: string;
  description?: string;
  image?: AssetImage;
  tags?: string[];
  links?: Array<{ locationId: string; kind?: string }>;
  coords?: { x?: number; y?: number };
  extra?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface Timeline {
  id: string;
  userId: UserId;
  seriesId: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Event {
  id: string;
  userId: UserId;
  seriesId: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  locationId?: string;
  characterIds?: string[];
  sceneIds?: string[];
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface BookItem {
  type: "chapter" | "scene";
  id: string;
  rank: string;
}
