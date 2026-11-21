import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Height of the floating tab bar, without the bottom safe area. */
export const NAV_HEIGHT = 64;

type Nav = { compact: Animated.Value; set: (on: boolean) => void };
const Ctx = createContext<Nav | null>(null);

/** Holds whether the floating tab bar is in its slightly smaller, scrolled-down state. */
export function NavBarProvider({ children }: { children: ReactNode }) {
  const [compact] = useState(() => new Animated.Value(0));
  const state = useRef(false);
  const value = useMemo<Nav>(
    () => ({
      compact,
      set(on) {
        if (state.current === on) return;
        state.current = on;
        Animated.spring(compact, { toValue: on ? 1 : 0, useNativeDriver: true, speed: 18, bounciness: 4 }).start();
      },
    }),
    [compact],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNavBar() {
  const nav = useContext(Ctx);
  if (!nav) throw new Error("useNavBar needs NavBarProvider");
  return nav;
}

/** onScroll for a tab's main list: the bar shrinks a little going down and comes back going up. */
export function useNavScroll() {
  const { set } = useNavBar();
  const last = useRef(0);
  return (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - last.current;
    last.current = y;
    if (y < 24) set(false);
    else if (dy > 6) set(true);
    else if (dy < -6) set(false);
  };
}

/** Space to leave under a tab's content so nothing hides behind the floating bar. */
export function useNavSpace() {
  const insets = useSafeAreaInsets();
  return NAV_HEIGHT + Math.max(insets.bottom, 12) + 24;
}
