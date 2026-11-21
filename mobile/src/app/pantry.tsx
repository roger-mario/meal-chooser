import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { inputStyle } from "@/components/SaveSheet";
import { Button, Card, Dish, Empty, H, T } from "@/components/ui";
import { api, type MealDetail } from "@/lib/api";
import { useData } from "@/lib/data";
import { pantryMatch, parsePantry, usePrefs } from "@/lib/prefs";
import { C } from "@/lib/theme";

const QUICK = ["chicken", "eggs", "rice", "pasta", "spinach", "tomatoes", "onion", "salmon", "potatoes", "feta"];

/** "What's at home": type what you have, see what you can cook and what's missing. */
export default function Pantry() {
  const router = useRouter();
  const { library } = useData();
  const { prefs, update } = usePrefs();
  const [text, setText] = useState("");

  const matches = useMemo(
    () =>
      (library?.meals ?? [])
        .filter((m) => m.ingredients.length)
        .map((m) => ({ m, ...pantryMatch(m, prefs.pantry) }))
        .sort((a, b) => b.have / b.total - a.have / a.total || (b.m.score ?? 0) - (a.m.score ?? 0))
        .slice(0, 12),
    [library, prefs.pantry],
  );
  const add = (t: string) => {
    update({ pantry: parsePantry(t, prefs.pantry) });
    setText("");
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8, paddingTop: 6 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
          <Icon.back />
        </Pressable>
        <T w="extrabold" s={24} style={{ letterSpacing: -0.4 }}>
          What’s at home
        </T>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <T s={15} color={C.muted}>
          Write down what you have, separated by commas. Salt, oil and spices always count.
        </T>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput accessibilityLabel="Add items" placeholder="e.g. chicken, spinach, feta" placeholderTextColor={C.off} value={text} onChangeText={setText} onSubmitEditing={() => add(text)} returnKeyType="done" style={[inputStyle, { height: 48 }]} />
          <Button label="Add" onPress={() => add(text)} disabled={!text.trim()} />
        </View>
        {prefs.pantry.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {prefs.pantry.map((p) => (
              <Pressable key={p} accessibilityRole="button" accessibilityLabel={`Remove ${p}`} onPress={() => update({ pantry: prefs.pantry.filter((x) => x !== p) })} style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 36, paddingLeft: 14, paddingRight: 10, borderRadius: 18, backgroundColor: C.mint }}>
                <T w="semibold" s={14} color={C.mintInk}>
                  {p}
                </T>
                <Icon.close size={12} color={C.mintInk} />
              </Pressable>
            ))}
          </View>
        )}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <T s={13} color={C.muted}>
            Quick add
          </T>
          {QUICK.filter((q) => !prefs.pantry.includes(q))
            .slice(0, 6)
            .map((q) => (
              <Pressable key={q} accessibilityRole="button" onPress={() => add(q)} style={{ height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: C.lineStrong, justifyContent: "center" }}>
                <T w="semibold" s={13}>
                  + {q}
                </T>
              </Pressable>
            ))}
        </View>

        <H style={{ marginTop: 6 }}>You can cook</H>
        {matches.length === 0 ? (
          <Empty title="No recipes yet" text="Add recipes first, then Otao can match them to what's at home." />
        ) : (
          matches.map(({ m, have, total, missing }) => (
            <Card key={m.id} onPress={() => router.push(`/recipe/${m.id}`)} style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Dish meal={m} style={{ width: 52, height: 52 }} radius={12} />
                <View style={{ flex: 1 }}>
                  <T w="bold" s={16} numberOfLines={1}>
                    {m.name}
                  </T>
                  <T w="semibold" s={13} color={missing.length ? C.muted : C.mintInk}>
                    {missing.length ? `${have} of ${total} at home` : "Everything is at home"}
                  </T>
                </View>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: C.sand }}>
                <View style={{ width: `${Math.round((have * 100) / total)}%`, height: 6, borderRadius: 3, backgroundColor: C.green }} />
              </View>
              {missing.length > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <T s={13} color={C.muted} style={{ flex: 1 }} numberOfLines={2}>
                    Missing: {missing.join(", ")}
                  </T>
                  <Button
                    label="Add to Bring"
                    kind="secondary"
                    size="sm"
                    onPress={async () => {
                      // Bring! imports the whole recipe and lets you untick what you already have.
                      const detail = await api<MealDetail>(`/meals/${m.id}`);
                      await Linking.openURL(detail.bringUrl);
                    }}
                  />
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
