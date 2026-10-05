import { AppwriteException, ID } from 'appwrite';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { account } from '../appwrite/client';
import type { Author } from '../appwrite/messagesRepository';

interface AuthState {
  user: Author | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Turns any thrown value into a message safe to show the user (no stack, no personal data). */
export function describeAuthError(error: unknown): string {
  if (error instanceof AppwriteException) return error.message;
  return 'Something went wrong. Check your connection and try again.';
}

async function fetchCurrentUser(): Promise<Author | null> {
  try {
    const user = await account.get();
    return { id: user.$id, name: user.name || 'Anonymous' };
  } catch (error) {
    // Fails open to "logged out": 401 means no session, which is the normal first-launch state.
    if (error instanceof AppwriteException && error.code === 401) return null;
    throw error;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Author | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      // Fails open to the login screen: if Appwrite is unreachable the user can still retry from there.
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await account.createEmailPasswordSession({ email, password });
    setUser(await fetchCurrentUser());
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await account.create({ userId: ID.unique(), email, password, name });
      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    await account.deleteSession({ sessionId: 'current' });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
