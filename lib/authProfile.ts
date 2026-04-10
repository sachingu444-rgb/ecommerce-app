import { User, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "../firebaseConfig";
import { UserProfile, UserRole } from "../types";

const buildFallbackName = (user: User) =>
  user.displayName ||
  user.email?.split("@")[0] ||
  "ShopApp User";

export const ensureUserProfile = async (
  user: User,
  preferredRole: UserRole = "buyer"
) => {
  const name = buildFallbackName(user);

  if (!user.displayName && name) {
    await updateProfile(user, {
      displayName: name,
    });
  }

  const userRef = doc(db, "users", user.uid);

  try {
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const existingProfile = snapshot.data() as UserProfile;
      await setDoc(
        userRef,
        {
          uid: user.uid,
          name,
          email: user.email || existingProfile.email || "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return {
        profile: {
          ...existingProfile,
          uid: user.uid,
          name,
          email: user.email || existingProfile.email || "",
        } as UserProfile,
        isNewUser: false,
        role: existingProfile.role || preferredRole,
      };
    }

    const newProfile: UserProfile = {
      uid: user.uid,
      name,
      email: user.email || "",
      role: preferredRole,
      storeName: preferredRole === "seller" ? name : "",
      storeApproved: false,
    };

    await setDoc(
      userRef,
      {
        ...newProfile,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      profile: newProfile,
      isNewUser: true,
      role: preferredRole,
    };
  } catch {
    const fallbackProfile: UserProfile = {
      uid: user.uid,
      name,
      email: user.email || "",
      role: preferredRole,
      storeApproved: false,
      storeName: preferredRole === "seller" ? name : "",
    };

    return {
      profile: fallbackProfile,
      isNewUser: true,
      role: preferredRole,
    };
  }
};
