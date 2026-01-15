import { Handlers } from "$fresh/server.ts";
import { getUser } from "../../utils/session.ts";

const kv = await Deno.openKv();

export interface Note {
  id: string;
  userId: number;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export const handler: Handlers = {
  async GET(req) {
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

    // List all notes for the user
    const notes: Note[] = [];
    const entries = kv.list<Note>({ prefix: ["notes", user.id] });

    for await (const entry of entries) {
      notes.push(entry.value);
    }

    return new Response(
      JSON.stringify({ notes }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  },

  async POST(req) {
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

    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "Title and content are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const id = crypto.randomUUID();
    const now = Date.now();
    const note: Note = {
      id,
      userId: user.id,
      title,
      content,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(["notes", user.id, id], note);

    return new Response(
      JSON.stringify({ note }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  },
};
