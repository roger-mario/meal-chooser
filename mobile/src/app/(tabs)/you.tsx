import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState, type ReactNode } from "react";
import { Alert, Pressable, ScrollView, Share, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { Avatar, Card, T } from "@/components/ui";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { useNavScroll, useNavSpace } from "@/lib/navbar";
import { usePrefs } from "@/lib/prefs";
import { C } from "@/lib/theme";

export default function You() {
  const router = useRouter();
  const onScroll = useNavScroll();
  const bottom = useNavSpace();
  const { me, signOut, deleteAccount } = useAuth();
  const { library } = useData();
  const { prefs, update } = usePrefs();
  const [inviting, setInviting] = useState(false);
  if (!me) return null;

  const mine = library?.meals.filter((m) => m.mine).length ?? 0;
  const prefsText = [...prefs.likes.slice(0, 3), prefs.avoid.length ? `no ${prefs.avoid.slice(0, 2).join(", ").toLowerCase()}` : "no restrictions"].join(" · ");

  async function invite() {
    setInviting(true);
    try {
      const r = await api<{ code: string }>("/invites", { method: "POST" });
      await Share.share({ message: `Join me on Otao, our recipe and meal-plan app. Your invite code: ${r.code}` });
    } catch (e) {
      Alert.alert("Couldn't create an invite", (e as Error).message);
    } finally {
      setInviting(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete your account?", "This removes your sign-in, your collections and your likes. Recipes you added stay for your household.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteAccount().catch((e: Error) => Alert.alert("Couldn't delete your account", e.message)),
      },
    ]);
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView onScroll={onScroll} scrollEventThrottle={32} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottom }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Avatar name={me.name} id={me.id} size={72} />
          <View style={{ flex: 1 }}>
            <T w="extrabold" s={22}>
              {me.name}
            </T>
            <T s={14} color={C.muted}>
              {mine} {mine === 1 ? "recipe" : "recipes"} · {library?.likedIds.length ?? 0} liked
            </T>
          </View>
        </View>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <Row icon={<Icon.plan size={20} color={C.mintInk} />} bg={C.mint} title="Shared planner" sub="Who plans and cooks with you" onPress={() => router.push("/household")} />
          <Row icon={<Icon.leaf />} bg={C.butter} title="Food preferences" sub={prefsText} onPress={() => router.push("/onboarding?step=2")} />
          <Row icon={<Icon.stack />} bg={C.peach} title="Collections" sub={`${library?.collections.length ?? 0} collections`} onPress={() => router.navigate("/")} />
          <Row icon={<Icon.invite />} bg={C.sky} title={inviting ? "Creating invite…" : "Invite friends"} sub="Otao is invite-only for now" onPress={invite} last />
        </Card>

        <Card style={{ gap: 10 }}>
          <T w="extrabold" s={15}>
            How you use Otao
          </T>
          <View style={{ flexDirection: "row", backgroundColor: C.sand, borderRadius: 20, padding: 4 }}>
            {(
              [
                ["plan", "I plan my meals"],
                ["recipes", "Just recipes"],
              ] as const
            ).map(([v, label]) => (
              <Pressable key={v} accessibilityRole="tab" accessibilityState={{ selected: prefs.usage === v }} onPress={() => update({ usage: v })} style={{ flex: 1, height: 36, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: prefs.usage === v ? C.card : "transparent" }}>
                <T w="bold" s={13}>
                  {label}
                </T>
              </Pressable>
            ))}
          </View>
          <T s={13} color={C.muted}>
            Changes what Home shows first.
          </T>
        </Card>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <Row title="Privacy policy" onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/privacy`)} />
          <Row title="Sign out" onPress={signOut} />
          <Row title="Delete account" danger onPress={confirmDelete} last />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, bg, title, sub, onPress, last, danger }: { icon?: ReactNode; bg?: string; title: string; sub?: string; onPress: () => void; last?: boolean; danger?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.sand, backgroundColor: pressed ? C.sand : "transparent" })}>
      {icon && <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>{icon}</View>}
      <View style={{ flex: 1 }}>
        <T w="bold" s={15} color={danger ? "#B42318" : C.ink}>
          {title}
        </T>
        {sub ? (
          <T s={13} color={C.muted} numberOfLines={1}>
            {sub}
          </T>
        ) : null}
      </View>
      <Icon.chevron />
    </Pressable>
  );
}

