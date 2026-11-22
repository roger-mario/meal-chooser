import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Share, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Chip, Dish, T } from "@/components/ui";
import { api } from "@/lib/api";
import { usePrefs, type Prefs } from "@/lib/prefs";
import { C } from "@/lib/theme";

const LIKES = ["Vegetarian", "Fish", "Chicken", "Pasta", "Asian", "Bowls", "Soups", "Quick meals", "Meal prep", "Baking"];
const AVOID = ["Nuts", "Dairy", "Gluten", "Pork", "Spicy", "Shellfish"];
const STEPS = 4;

/** Four short, optional steps. Opened after the first sign-in, and from "Food preferences" (?step=2). */
export default function Onboarding() {
  const router = useRouter();
  const params = useLocalSearchParams<{ step?: string }>();
  const fromSettings = params.step != null;
  const { prefs, update } = usePrefs();
  const [step, setStep] = useState(Math.min(STEPS - 1, Number(params.step ?? 0) || 0));
  const [draft, setDraft] = useState<Pick<Prefs, "usage" | "likes" | "avoid" | "household" | "littleOne">>({ usage: prefs.usage, likes: prefs.likes, avoid: prefs.avoid, household: prefs.household, littleOne: prefs.littleOne });

  const toggle = (key: "likes" | "avoid", v: string) => setDraft((d) => ({ ...d, [key]: d[key].includes(v) ? d[key].filter((x) => x !== v) : [...d[key], v] }));
  const finish = () => {
    update({ ...draft, onboarded: true, bannerHidden: draft.likes.length > 0 || prefs.bannerHidden });
    if (fromSettings) router.back();
    else router.replace("/");
  };
  const next = () => (step === STEPS - 1 || (fromSettings && step === 2) ? finish() : setStep(step + 1));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingTop: 8 }}>
        {Array.from({ length: STEPS }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? C.coral : C.lineStrong }} />
        ))}
        <Pressable accessibilityRole="button" onPress={finish} hitSlop={10} style={{ marginLeft: 10 }}>
          <T w="bold" s={14} color={C.muted}>
            {fromSettings ? "Close" : "Skip"}
          </T>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 16 }}>
        {step === 0 && (
          <>
            <View style={{ height: 240, borderRadius: 28, backgroundColor: C.peach, padding: 12, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {[11, 12, 13, 14].map((id, i) => (
                <Dish key={id} meal={{ id, name: ["Bowl", "Patties", "Salmon traybake", "Lasagne"][i], imageUrl: null }} style={{ width: "48%", height: 102 }} radius={18} />
              ))}
            </View>
            <T w="extrabold" s={30} style={{ letterSpacing: -0.6, lineHeight: 34 }}>
              Welcome to Otao
            </T>
            <T s={16} color={C.ink2} style={{ lineHeight: 23 }}>
              A few quick questions help Otao suggest the right things. Everything is optional and you can change it later.
            </T>
          </>
        )}
        {step === 1 && (
          <>
            <T w="extrabold" s={26} style={{ letterSpacing: -0.4 }}>
              How do you want to use Otao?
            </T>
            {(
              [
                ["plan", "I plan my meals", "Plan the week, share it with family, and get a shopping list."],
                ["recipes", "I just want recipes", "Find easy, healthy ideas when you need them. No tracking."],
              ] as const
            ).map(([v, title, sub]) => (
              <Card key={v} onPress={() => setDraft({ ...draft, usage: v })} style={{ gap: 4, borderWidth: 2, borderColor: draft.usage === v ? C.coral : C.line, backgroundColor: draft.usage === v ? "#FFF5F1" : C.card }}>
                <T w="extrabold" s={17}>
                  {title}
                </T>
                <T s={14} color={C.ink2}>
                  {sub}
                </T>
              </Card>
            ))}
          </>
        )}
        {step === 2 && (
          <>
            <T w="extrabold" s={26} style={{ letterSpacing: -0.4 }}>
              What do you like to eat?
            </T>
            <T s={14} color={C.muted}>
              Pick as many as you like.
            </T>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {LIKES.map((l) => (
                <Chip key={l} label={l} on={draft.likes.includes(l)} onPress={() => toggle("likes", l)} />
              ))}
            </View>
            <T w="bold" s={16} style={{ marginTop: 8 }}>
              Anything to avoid?
            </T>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {AVOID.map((l) => (
                <Chip key={l} label={l} on={draft.avoid.includes(l)} onPress={() => toggle("avoid", l)} />
              ))}
            </View>
          </>
        )}
        {step === 3 && (
          <>
            <T w="extrabold" s={26} style={{ letterSpacing: -0.4 }}>
              Who are you cooking for?
            </T>
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <T w="bold" s={16} style={{ flex: 1 }}>
                People at home
              </T>
              <Button label="–" kind="secondary" size="sm" accessibilityLabel="Fewer" onPress={() => setDraft({ ...draft, household: Math.max(1, draft.household - 1) })} />
              <T w="extrabold" s={18} style={{ width: 24, textAlign: "center" }}>
                {draft.household}
              </T>
              <Button label="+" kind="secondary" size="sm" accessibilityLabel="More" onPress={() => setDraft({ ...draft, household: Math.min(12, draft.household + 1) })} />
            </Card>
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <T w="bold" s={16}>
                  A little one eats with us
                </T>
                <T s={13} color={C.muted}>
                  Shows baby-friendly recipes first
                </T>
              </View>
              <Switch value={draft.littleOne} onValueChange={(v) => setDraft({ ...draft, littleOne: v })} trackColor={{ true: C.green, false: C.lineStrong }} />
            </Card>
            <View style={{ backgroundColor: C.sky, borderRadius: 20, padding: 16, gap: 8 }}>
              <T w="extrabold" s={16} color="#173A5C">
                Plan together
              </T>
              <T s={14} color="#1F4A72">
                Invite your partner or family to share one plan and shopping list.
              </T>
              <Button
                label="Invite someone"
                kind="secondary"
                size="sm"
                style={{ alignSelf: "flex-start", borderWidth: 0 }}
                onPress={async () => {
                  const r = await api<{ code: string }>("/invites", { method: "POST" }).catch(() => null);
                  if (r) await Share.share({ message: `Join our kitchen on Otao. Your invite code: ${r.code}` });
                }}
              />
            </View>
          </>
        )}
        <View style={{ flex: 1 }} />
        <Button label={step === 0 ? "Get started" : step === STEPS - 1 || (fromSettings && step === 2) ? "Done" : "Next"} size="lg" onPress={next} />
      </ScrollView>
    </SafeAreaView>
  );
}
