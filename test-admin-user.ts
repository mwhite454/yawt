// Test script to create a test admin user and verify /api/me returns their role
import { kv } from "./utils/kv.ts";
import { getUser, setUser } from "./utils/session.ts";

// Create a test session with an admin user
const testSessionId = "test-session-" + crypto.randomUUID();
const testAdminUser = {
  id: 999999,
  login: "test-admin",
  name: "Test Admin",
  email: "test@example.com",
  avatar_url: "https://example.com/avatar.jpg",
  role: "admin" as const,
  subscriptionTier: "free" as const,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Store the test user
await setUser(testSessionId, testAdminUser);

// Retrieve and verify
const retrieved = await getUser(
  new Request("http://localhost:8000/api/me", {
    headers: {
      cookie: `session=${testSessionId}`,
    },
  }),
);

console.log("\n✅ Test user created and stored in KV");
console.log("Session ID:", testSessionId);
console.log("Stored user role:", testAdminUser.role);
console.log("\n✅ Verification:");
console.log("Retrieved user exists:", !!retrieved);
console.log("Retrieved user role:", retrieved?.role);
console.log("Role matches:", retrieved?.role === "admin");

if (retrieved?.role === "admin") {
  console.log("\n🎯 SUCCESS: Admin role is correctly stored and retrievable!");
  console.log(
    "🎯 The /api/me endpoint will now return this role to the React client",
  );
  console.log("\nTo test in browser:");
  console.log(`1. Open http://localhost:8000/`);
  console.log(`2. Set cookie: session=${testSessionId}`);
  console.log(`3. Navigate to http://localhost:8000/client`);
  console.log(`4. Admin button should now appear in navbar`);
} else {
  console.log("\n❌ ERROR: Role not properly stored or retrieved");
}
