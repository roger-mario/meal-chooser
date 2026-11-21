import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Share, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { Avatar, Button, Card, T } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isoDay } from "@/lib/dates";
import { usePlan } from "@/lib/plan";
import { C } from "@/lib/theme";

/** Everyone here sees and edits the same plan and shopping list. */
export default function Household() {
  const router = useRouter();
  const { me } = useAuth();
  const { plan } = usePlan(isoDay(), isoDay());
  const [busy, setBusy] = useState(false);
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8, paddingTop: 6 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
          <Icon.back />
        </Pressable>
        <T w="extrabold" s={24} style={{ letterSpacing: -0.4 }}>
          Shared planner
        </T>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        <T s={15} color={C.muted} style={{ marginBottom: 4 }}>
          Everyone here sees and edits the same plan and shopping list.
        </T>
        {(plan?.people ?? []).map((p) => (
          <Card key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Avatar name={p.name} id={p.id} size={40} />
            <View style={{ flex: 1 }}>
              <T w="bold" s={16}>
                {p.name}
                {p.id === me?.id ? " (you)" : ""}
              </T>
              <T s={13} color={C.muted}>
                Plans and cooks
              </T>
            </View>
          </Card>
        ))}
        <Button
          label="Invite someone to plan with you"
          size="lg"
          busy={busy}
          style={{ marginTop: 6 }}
          onPress={async () => {
            setBusy(true);
            try {
              const r = await api<{ code: string }>("/invites", { method: "POST" });
              await Share.share({ message: `Join our kitchen on Otao. Your invite code: ${r.code}` });
            } catch (e) {
              Alert.alert("Couldn't create an invite", (e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
