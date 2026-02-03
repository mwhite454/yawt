import { UserMenu } from "../UserMenu.tsx";
import type { User } from "@utils/session.ts";

const mockUser: User = {
  id: 12345,
  login: "testuser",
  name: "Test User",
  avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
  sessionId: "test-session-id",
  defaultTheme: "yawt",
};

const mockUserNoAvatar: User = {
  id: 67890,
  login: "noavataruser",
  name: "No Avatar User",
  avatar_url: "",
  sessionId: "test-session-id-2",
  defaultTheme: "light",
};

const mockUserNoName: User = {
  id: 11111,
  login: "loginonly",
  name: "",
  avatar_url: "https://avatars.githubusercontent.com/u/11111?v=4",
  sessionId: "test-session-id-3",
  defaultTheme: "dark",
};

export const LoggedOut = () => <UserMenu user={null} />;

export const LoggedIn = () => <UserMenu user={mockUser} />;

export const LoggedInNoAvatar = () => <UserMenu user={mockUserNoAvatar} />;

export const LoggedInNoName = () => <UserMenu user={mockUserNoName} />;
