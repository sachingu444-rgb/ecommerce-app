import { useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "../firebaseConfig";
import { useAuth } from "../hooks/useAuth";
import { useCartStore } from "../store/cartStore";
import { CartItem } from "../types";

export const useCartSync = () => {
  const { user } = useAuth();
  const items = useCartStore((state) => state.items);
  const setItems = useCartStore((state) => state.setItems);
  const hasLoaded = useRef(false);
  const isLoading = useRef(false);

  useEffect(() => {
    const loadCart = async () => {
      if (!user) {
        hasLoaded.current = false;
        return;
      }

      try {
        isLoading.current = true;
        const cartSnapshot = await getDoc(doc(db, "cart", user.uid));
        if (cartSnapshot.exists()) {
          const remoteItems = ((cartSnapshot.data()?.items as CartItem[]) || []).map(
            (item) => ({
              ...item,
              quantity: Math.max(1, item.quantity || 1),
            })
          );
          setItems(remoteItems);
        }
      } catch {
        // Fall back to the local in-memory cart when cart permissions are restricted.
      } finally {
        hasLoaded.current = true;
        isLoading.current = false;
      }
    };

    loadCart();
  }, [setItems, user]);

  useEffect(() => {
    const syncCart = async () => {
      if (!user || !hasLoaded.current || isLoading.current) {
        return;
      }

      try {
        await setDoc(
          doc(db, "cart", user.uid),
          {
            items,
          },
          { merge: true }
        );
      } catch {
        // Keep local cart usable even if Firestore sync is temporarily unavailable.
      }
    };

    syncCart();
  }, [items, user]);
};
