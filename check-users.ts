// Script to check and log user data in KV store
import { kv } from "./utils/kv.ts";

// List all user profiles to see if any have admin role
const profiles = kv.list({
  prefix: ["yawt", "userProfiles"],
});

let adminFound = false;
let count = 0;

for await (const entry of profiles) {
  count++;
  const profile = entry.value as any;
  console.log(`\nProfile #${count}:`);
  console.log(`  ID: ${profile?.id}`);
  console.log(`  Login: ${profile?.login}`);
  console.log(`  Role: ${profile?.role || "undefined"}`);
  console.log(`  Created: ${profile?.createdAt}`);

  if (profile?.role === "admin") {
    adminFound = true;
  }
}

console.log(`\n📊 Total profiles: ${count}`);
console.log(`👑 Admin found: ${adminFound ? "YES" : "NO"}`);

// Also check active sessions
const sessions = kv.list({
  prefix: ["users"],
});

let sessionCount = 0;
let adminSessions = 0;

for await (const entry of sessions) {
  sessionCount++;
  const user = entry.value as any;
  if (user?.role === "admin") {
    adminSessions++;
    console.log(`\n✅ Found admin session:`, entry.key);
  }
}

console.log(`\n📊 Total sessions: ${sessionCount}`);
console.log(`👑 Admin sessions: ${adminSessions}`);
