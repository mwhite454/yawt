import { Layout } from "../Layout.tsx";
import type { User } from "@utils/session.ts";
import type { Series } from "@utils/story/types.ts";

const mockUser: User = {
  id: 12345,
  login: "testuser",
  name: "Test User",
  avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
  sessionId: "test-session-id",
  defaultTheme: "yawt",
};

const mockSeries: Series[] = [
  {
    id: "series-1",
    userId: 12345,
    title: "The First Series",
    description: "A great fantasy series",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "series-2",
    userId: 12345,
    title: "Another Series",
    description: "A sci-fi adventure",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const LoggedOut = () => (
  <Layout user={null}>
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Welcome!</h2>
        <p>This is the layout when not logged in.</p>
      </div>
    </div>
  </Layout>
);

export const LoggedInNoSeries = () => (
  <Layout user={mockUser}>
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">No Series Yet</h2>
        <p>This is the layout when logged in with no series.</p>
      </div>
    </div>
  </Layout>
);

export const LoggedInWithSeries = () => (
  <Layout user={mockUser} series={mockSeries}>
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">With Series</h2>
        <p>This is the layout when logged in with series available.</p>
      </div>
    </div>
  </Layout>
);

export const WithSeriesNavigation = () => (
  <Layout
    user={mockUser}
    series={mockSeries}
    currentSeriesId="series-1"
    currentPage="books"
  >
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Series Navigation</h2>
        <p>This shows the layout with series navigation tabs.</p>
      </div>
    </div>
  </Layout>
);

export const CharactersPage = () => (
  <Layout
    user={mockUser}
    series={mockSeries}
    currentSeriesId="series-1"
    currentPage="characters"
  >
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Characters Page</h2>
        <p>This shows the layout on the characters page.</p>
      </div>
    </div>
  </Layout>
);
