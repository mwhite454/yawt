import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "@utils/http.ts";
import type { Book, BookItem, Chapter, Scene } from "@utils/story/types.ts";
import {
  bookItemOrderKey,
  bookKey,
  bookOrderKey,
  chapterKey,
  chapterSceneOrderKey,
  sceneKey,
} from "@utils/story/keys.ts";
import { rankAfter, rankInitial } from "@utils/story/rank.ts";
import { deleteObject, getR2Bucket } from "@utils/r2.ts";

async function flattenChapters(
  kv: Deno.Kv,
  userId: number,
  seriesId: string,
  bookId: string,
  book: Book,
  bookEntityKey: Deno.KvKey,
): Promise<Response> {
  // 1. Collect all chapters (in order)
  const chapterItems: Array<{ rank: string; id: string }> = [];
  for await (
    const entry of kv.list<BookItem>({
      prefix: ["yawt", "bookItemOrder", userId, seriesId, bookId],
    })
  ) {
    if (entry.value?.type === "chapter") {
      const rankKey = entry.key[entry.key.length - 1] as string;
      chapterItems.push({ rank: rankKey, id: entry.value.id });
    }
  }

  let scenesFlattened = 0;
  const chaptersRemoved = chapterItems.length;

  // Find the last existing book-level item rank to append after
  let lastBookRank: string | undefined;
  for await (
    const entry of kv.list<BookItem>(
      { prefix: ["yawt", "bookItemOrder", userId, seriesId, bookId] },
      { reverse: true, limit: 1 },
    )
  ) {
    const rank = entry.key[entry.key.length - 1] as string;
    if (typeof rank === "string") lastBookRank = rank;
  }

  for (const { id: chapterId } of chapterItems) {
    // Collect scenes in this chapter
    const chapterScenes: Array<{ rank: string; sceneId: string }> = [];
    for await (
      const entry of kv.list({
        prefix: ["yawt", "chapterSceneOrder", userId, seriesId, bookId, chapterId],
      })
    ) {
      const key = entry.key;
      const rank = key[key.length - 2] as string;
      const sceneId = key[key.length - 1] as string;
      chapterScenes.push({ rank, sceneId });
    }

    for (const { sceneId } of chapterScenes) {
      const newRank = lastBookRank ? rankAfter(lastBookRank) : rankInitial();
      lastBookRank = newRank;

      const sceneEntityKey = sceneKey(userId, seriesId, bookId, sceneId);
      const sceneEntry = await kv.get<Scene>(sceneEntityKey);
      if (!sceneEntry.value) continue;

      const updatedScene: Scene = {
        ...sceneEntry.value,
        chapterId: undefined,
        rank: newRank,
        updatedAt: Date.now(),
      };

      // Find the chapterSceneOrder entry key for this scene
      let chapterSceneOrderEntryKey: Deno.KvKey | null = null;
      for await (
        const entry of kv.list({
          prefix: ["yawt", "chapterSceneOrder", userId, seriesId, bookId, chapterId],
        })
      ) {
        const entrySceneId = entry.key[entry.key.length - 1] as string;
        if (entrySceneId === sceneId) {
          chapterSceneOrderEntryKey = entry.key;
          break;
        }
      }

      const op = kv.atomic()
        .set(sceneEntityKey, updatedScene)
        .set(bookItemOrderKey(userId, seriesId, bookId, newRank), {
          type: "scene" as const,
          id: sceneId,
        });

      if (chapterSceneOrderEntryKey) {
        op.delete(chapterSceneOrderEntryKey);
      }

      await op.commit();
      scenesFlattened++;
    }

    // Delete the chapter entity and its bookItemOrder entry
    let chapterOrderKey: Deno.KvKey | null = null;
    for await (
      const entry of kv.list<BookItem>({
        prefix: ["yawt", "bookItemOrder", userId, seriesId, bookId],
      })
    ) {
      if (entry.value?.type === "chapter" && entry.value.id === chapterId) {
        chapterOrderKey = entry.key;
        break;
      }
    }

    const deleteOp = kv.atomic().delete(chapterKey(userId, seriesId, bookId, chapterId));
    if (chapterOrderKey) deleteOp.delete(chapterOrderKey);
    await deleteOp.commit();
  }

  // Update the book entity
  const updatedBook: Book = {
    ...book,
    hasChapters: false,
    updatedAt: Date.now(),
  };
  await kv.set(bookEntityKey, updatedBook);

  return json({ book: updatedBook, scenesFlattened, chaptersRemoved }, { status: 200 });
}

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;

    const { seriesId, bookId } = ctx.params;
    const entry = await kv.get<Book>(bookKey(user.id, seriesId, bookId));
    if (!entry.value) return notFound("Book not found");
    return json({ book: entry.value }, { status: 200 });
  },

  async PUT(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId } = ctx.params;

    const key = bookKey(user.id, seriesId, bookId);
    const entry = await kv.get<Book>(key);
    if (!entry.value) return notFound("Book not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    const title = typeof body.title === "string"
      ? body.title.trim()
      : undefined;
    if (title !== undefined && !title) {
      return badRequest("Title cannot be empty");
    }

    const author = typeof body.author === "string"
      ? body.author.trim()
      : undefined;
    const publishDate = typeof body.publishDate === "string"
      ? body.publishDate.trim()
      : undefined;
    const isbn = typeof body.isbn === "string" ? body.isbn.trim() : undefined;

    const expectedImagePrefix =
      `yawt/user/${user.id}/series/${seriesId}/books/${bookId}/cover/`;

    const prevObjectKey = entry.value.coverImage?.objectKey;

    let nextCoverImage: Book["coverImage"] | undefined = entry.value
      .coverImage;
    if (Object.prototype.hasOwnProperty.call(body, "coverImage")) {
      const raw = (body as { coverImage?: unknown }).coverImage;
      if (raw === null) {
        nextCoverImage = undefined;
      } else if (raw === undefined) {
        // no-op
      } else if (typeof raw === "object" && raw && !Array.isArray(raw)) {
        const img = raw as Record<string, unknown>;

        const objectKey = typeof img.objectKey === "string"
          ? img.objectKey.trim()
          : "";
        if (!objectKey) return badRequest("coverImage.objectKey is required");
        if (!objectKey.startsWith(expectedImagePrefix)) {
          return badRequest(
            `coverImage.objectKey must start with ${expectedImagePrefix}`,
          );
        }

        const contentType = typeof img.contentType === "string"
          ? img.contentType.trim()
          : undefined;
        const url = typeof img.url === "string" ? img.url.trim() : undefined;

        nextCoverImage = {
          objectKey,
          ...(contentType ? { contentType } : {}),
          ...(url ? { url } : {}),
        };
      } else {
        return badRequest("coverImage must be an object or null");
      }
    }

    const updated: Book = {
      ...entry.value,
      title: title ?? entry.value.title,
      author: author ?? entry.value.author,
      publishDate: publishDate ?? entry.value.publishDate,
      isbn: isbn ?? entry.value.isbn,
      coverImage: nextCoverImage,
      updatedAt: Date.now(),
    };

    await kv.set(key, updated);

    const nextObjectKey = updated.coverImage?.objectKey;
    if (prevObjectKey && prevObjectKey !== nextObjectKey) {
      // Validate the previous object key is within expected scope before deletion
      if (prevObjectKey.startsWith(expectedImagePrefix)) {
        const bucket = getR2Bucket();
        if (!bucket) {
          console.warn(
            "R2 bucket env var missing; skipping old image deletion",
            prevObjectKey,
          );
        } else {
          try {
            await deleteObject({ bucket, key: prevObjectKey });
          } catch (err) {
            console.warn(
              "Failed to delete previous book cover from R2",
              prevObjectKey,
              String(err),
            );
          }
        }
      } else {
        console.warn(
          "Skipping deletion of previous book cover with unexpected path",
          { prevObjectKey, expectedImagePrefix },
        );
      }
    }

    return json({ book: updated }, { status: 200 });
  },

  async PATCH(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId } = ctx.params;

    const key = bookKey(user.id, seriesId, bookId);
    const entry = await kv.get<Book>(key);
    if (!entry.value) return notFound("Book not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    if (typeof body.hasChapters !== "boolean") {
      return badRequest("hasChapters must be a boolean");
    }

    const currentHasChapters = entry.value.hasChapters !== false;
    const nextHasChapters = body.hasChapters as boolean;

    if (currentHasChapters === nextHasChapters) {
      return json({ book: entry.value, scenesFlattened: 0, chaptersRemoved: 0 }, { status: 200 });
    }

    if (!nextHasChapters) {
      return await flattenChapters(kv, user.id, seriesId, bookId, entry.value, key);
    } else {
      const updated: Book = { ...entry.value, hasChapters: true, updatedAt: Date.now() };
      await kv.set(key, updated);
      return json({ book: updated, scenesFlattened: 0, chaptersRemoved: 0 }, { status: 200 });
    }
  },

  async DELETE(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId } = ctx.params;

    const entry = await kv.get<Book>(bookKey(user.id, seriesId, bookId));
    if (!entry.value) return notFound("Book not found");

    const anyScenes = await kv
      .list(
        { prefix: ["yawt", "sceneOrder", user.id, seriesId, bookId] },
        { limit: 1 },
      )
      .next();
    if (!anyScenes.done) {
      return json(
        { error: "Book is not empty. Delete scenes first." },
        { status: 409 },
      );
    }

    const ok = await kv
      .atomic()
      .delete(bookKey(user.id, seriesId, bookId))
      .delete(bookOrderKey(user.id, seriesId, entry.value.rank, bookId))
      .commit();

    if (!ok.ok) {
      return json({ error: "Failed to delete book" }, { status: 500 });
    }
    return json({ message: "Book deleted" }, { status: 200 });
  },
};
