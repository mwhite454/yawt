export type UserId = number;

export interface Series {
  id: string;
  userId: UserId;
  title: string;
  description?: string;
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
  rank: string;
  text: string;
  derived: SceneDerived;
  createdAt: number;
  updatedAt: number;
}

export interface Character {
  id: string;
  userId: UserId;
  seriesId: string;
  name: string;
  description?: string;
  image?: {
    objectKey: string;
    url?: string;
    contentType?: string;
  };
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

export interface TimelineEvent {
  id: string;
  userId: UserId;
  seriesId: string;
  timelineId: string;
  rank: string;
  title: string;
  startDate?: string;
  endDate?: string;
  locationId?: string;
  characterIds?: string[];
  sceneId?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}
