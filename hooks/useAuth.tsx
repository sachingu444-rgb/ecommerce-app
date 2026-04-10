import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../firebaseConfig";
import { resolveRoleForEmail } from "../lib/admin";
import { UserProfile } from "../types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isSeller: boolean;
  isBuyer: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const createFallbackProfile = (user: User): UserProfile => ({
  uid: user.uid,
  name: user.displayName || "ShopApp User",
  email: user.email || "",
  role: resolveRoleForEmail("buyer", user.email),
  storeApproved: resolveRoleForEmail("buyer", user.email) === "admin",
});

const resolveProfileText = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const buildResolvedProfile = (
  user: User,
  currentProfile?: UserProfile | null
) => {
  const fallbackProfile = createFallbackProfile(user);
  const resolvedRole = resolveRoleForEmail(
    currentProfile?.role || fallbackProfile.role,
    user.email
  );
  const resolvedProfile: UserProfile = {
    ...fallbackProfile,
    ...currentProfile,
    uid: user.uid,
    name: resolveProfileText(currentProfile?.name, fallbackProfile.name),
    email: resolveProfileText(currentProfile?.email, fallbackProfile.email),
    role: resolvedRole,
    storeApproved:
      resolvedRole === "admin"
        ? true
        : currentProfile?.storeApproved ?? fallbackProfile.storeApproved,
  };
  const profilePatch: Partial<UserProfile> = {};

  if (!currentProfile || currentProfile.uid !== resolvedProfile.uid) {
    profilePatch.uid = resolvedProfile.uid;
  }

  if (!currentProfile || currentProfile.name !== resolvedProfile.name) {
    profilePatch.name = resolvedProfile.name;
  }

  if (!currentProfile || currentProfile.email !== resolvedProfile.email) {
    profilePatch.email = resolvedProfile.email;
  }

  if (!currentProfile || currentProfile.role !== resolvedProfile.role) {
    profilePatch.role = resolvedProfile.role;
  }

  if (
    !currentProfile ||
    currentProfile.storeApproved !== resolvedProfile.storeApproved
  ) {
    profilePatch.storeApproved = resolvedProfile.storeApproved;
  }

  return { fallbackProfile, resolvedProfile, profilePatch };
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!auth.currentUser) {
      setProfile(null);
      return;
    }

    const { fallbackProfile } = buildResolvedProfile(auth.currentUser);

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const snapshot = await getDoc(userRef);
      if (!snapshot.exists()) {
        await setDoc(
          userRef,
          {
            ...fallbackProfile,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
        setProfile(fallbackProfile);
        return;
      }

      const currentProfile = snapshot.data() as UserProfile;
      const { resolvedProfile, profilePatch } = buildResolvedProfile(
        auth.currentUser,
        currentProfile
      );

      if (Object.keys(profilePatch).length > 0) {
        await setDoc(
          userRef,
          {
            ...profilePatch,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      setProfile(resolvedProfile);
    } catch {
      setProfile(fallbackProfile);
      return;
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser: User | null) => {
      setUser(currentUser);

      if (!currentUser) {
        unsubscribeProfile?.();
        unsubscribeProfile = null;
        setProfile(null);
        setLoading(false);
        return;
      }

      const { fallbackProfile } = buildResolvedProfile(currentUser);

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) {
          await setDoc(
            userRef,
            {
              ...fallbackProfile,
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
          setProfile(createFallbackProfile(currentUser));
        }
        unsubscribeProfile?.();
        unsubscribeProfile = onSnapshot(
          userRef,
          (docSnapshot: { exists: () => boolean; data: () => unknown }) => {
            if (docSnapshot.exists()) {
              const currentProfile = docSnapshot.data() as UserProfile;
              const { resolvedProfile, profilePatch } = buildResolvedProfile(
                currentUser,
                currentProfile
              );

              if (Object.keys(profilePatch).length > 0) {
                void setDoc(
                  userRef,
                  {
                    ...profilePatch,
                    updatedAt: serverTimestamp(),
                  },
                  { merge: true }
                );
              }

              setProfile(resolvedProfile);
            } else {
              setProfile(fallbackProfile);
            }
            setLoading(false);
          },
          () => {
            setProfile(fallbackProfile);
            setLoading(false);
          }
        );
      } catch {
        setProfile(fallbackProfile);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isSeller: profile?.role === "seller",
      isBuyer: profile?.role === "buyer",
      isAdmin: profile?.role === "admin",
      refreshProfile,
    }),
    [loading, profile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
