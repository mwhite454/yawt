/// <reference lib="deno.unstable" />

import type { UserId } from "./types.ts";

export function seriesKey(userId: UserId, seriesId: string): Deno.KvKey {
  return ["yawt", "series", userId, seriesId];
}

export function bookKey(
  userId: UserId,
  seriesId: string,
  bookId: string,
): Deno.KvKey {
  return ["yawt", "book", userId, seriesId, bookId];
}

export function bookOrderKey(
  userId: UserId,
  seriesId: string,
  rank: string,
  bookId: string,
): Deno.KvKey {
  return ["yawt", "bookOrder", userId, seriesId, rank, bookId];
}

export function sceneKey(
  userId: UserId,
  seriesId: string,
  bookId: string,
  sceneId: string,
): Deno.KvKey {
  return ["yawt", "scene", userId, seriesId, bookId, sceneId];
}

export function sceneOrderKey(
  userId: UserId,
  seriesId: string,
  bookId: string,
  rank: string,
  sceneId: string,
): Deno.KvKey {
  return ["yawt", "sceneOrder", userId, seriesId, bookId, rank, sceneId];
}

export function characterKey(
  userId: UserId,
  seriesId: string,
  characterId: string,
): Deno.KvKey {
  return ["yawt", "character", userId, seriesId, characterId];
}

export function locationKey(
  userId: UserId,
  seriesId: string,
  locationId: string,
): Deno.KvKey {
  return ["yawt", "location", userId, seriesId, locationId];
}

export function timelineKey(
  userId: UserId,
  seriesId: string,
  timelineId: string,
): Deno.KvKey {
  return ["yawt", "timeline", userId, seriesId, timelineId];
}

export function timelineEventKey(
  userId: UserId,
  seriesId: string,
  timelineId: string,
  eventId: string,
): Deno.KvKey {
  return ["yawt", "timelineEvent", userId, seriesId, timelineId, eventId];
}

export function timelineOrderKey(
  userId: UserId,
  seriesId: string,
  timelineId: string,
  rank: string,
  eventId: string,
): Deno.KvKey {
  return ["yawt", "timelineOrder", userId, seriesId, timelineId, rank, eventId];
}

export function eventKey(
  userId: UserId,
  seriesId: string,
  eventId: string,
): Deno.KvKey {
  return ["yawt", "event", userId, seriesId, eventId];
}
