import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useData } from "@/lib/data";
import { C, F } from "@/lib/theme";
import { Button, Dish, Sheet, T } from "./ui";

export const inputStyle = { flex: 1, minWidth: 0, height: 46, borderRadius: 23, borderWidth: 1, borderColor: C.lineStrong, backgroundColor: C.card, paddingHorizontal: 16, fontSize: 16, fontFamily: F.regular, color: C.ink } as const;

/** "Save to collection": tick the collections a recipe belongs to, or start a new one. */
export function SaveSheet({ mealId, onClose }: { mealId: number | null; onClose: () => void }) {
  const { library, meal, toggleInCollection, createCollection } = useData();
  const [name, setName] = useState("");
  const m = meal(mealId);
  return (
    <Sheet open={mealId != null} onClose={onClose} title={m ? `Save ${m.name}` : "Save"}>
      {library?.collections.map((c) => {
        const on = mealId != null && c.mealIds.includes(mealId);
        const first = meal(c.mealIds[0]) ?? m;
        return (
          <Pressable
            key={c.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            onPress={() => mealId != null && toggleInCollection(c.id, mealId)}
            style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 10 }}
          >
            {first ? <Dish meal={first} style={{ width: 40, height: 40 }} radius={12} /> : <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.sand }} />}
            <T w="bold" s={15} style={{ flex: 1 }}>
              {c.name}
            </T>
            <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: on ? C.mintInk : C.lineStrong, backgroundColor: on ? C.mintInk : "transparent", alignItems: "center", justifyContent: "center" }}>
              {on && <T w="extrabold" s={13} color="#FFFFFF">✓</T>}
            </View>
          </Pressable>
        );
      })}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput placeholder="New collection, e.g. Date night" placeholderTextColor={C.off} value={name} onChangeText={setName} style={inputStyle} returnKeyType="done" />
        <Button
          label="Create"
          kind="dark"
          disabled={!name.trim()}
          onPress={async () => {
            await createCollection(name.trim(), mealId ?? undefined);
            setName("");
          }}
        />
      </View>
      <Button label="Done" size="lg" onPress={onClose} />
    </Sheet>
  );
}

export function NewCollectionSheet({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (name: string) => Promise<unknown> }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title="New collection">
      <TextInput autoFocus placeholder="e.g. Weekly meals, Baby dinner" placeholderTextColor={C.off} value={name} onChangeText={setName} style={inputStyle} />
      <Button
        label="Create collection"
        size="lg"
        busy={busy}
        disabled={!name.trim()}
        onPress={async () => {
          setBusy(true);
          try {
            await onCreate(name.trim());
            setName("");
            onClose();
          } finally {
            setBusy(false);
          }
        }}
      />
    </Sheet>
  );
}
