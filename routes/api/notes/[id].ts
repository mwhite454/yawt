import { Handlers } from "$fresh/server.ts";
import { getUser } from "../../../utils/session.ts";
import type { Note } from "../notes.ts";

const kv = await Deno.openKv();

export const handler: Handlers = {
  async GET(_req, ctx) {
    const user = await getUser(_req);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { id } = ctx.params;
    const entry = await kv.get<Note>(["notes", user.id, id]);

    if (!entry.value) {
      return new Response(
        JSON.stringify({ error: "Note not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ note: entry.value }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  },

  async PUT(req, ctx) {
    const user = await getUser(req);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { id } = ctx.params;
    const entry = await kv.get<Note>(["notes", user.id, id]);

    if (!entry.value) {
      return new Response(
        JSON.stringify({ error: "Note not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    const { title, content } = body;

    const updatedNote: Note = {
      ...entry.value,
      title: title ?? entry.value.title,
      content: content ?? entry.value.content,
      updatedAt: Date.now(),
    };

    await kv.set(["notes", user.id, id], updatedNote);

    return new Response(
      JSON.stringify({ note: updatedNote }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  },

  async DELETE(req, ctx) {
    const user = await getUser(req);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { id } = ctx.params;
    const entry = await kv.get<Note>(["notes", user.id, id]);

    if (!entry.value) {
      return new Response(
        JSON.stringify({ error: "Note not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await kv.delete(["notes", user.id, id]);

    return new Response(
      JSON.stringify({ message: "Note deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  },
};
