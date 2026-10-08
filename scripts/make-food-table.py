# Builds src/data/usda-foods.json from the USDA FoodData Central "SR Legacy" CSV download
# (https://fdc.nal.usda.gov/download-datasets): python3 scripts/make-food-table.py <unzipped folder> src/data/usda-foods.json
import csv, json, sys
src = sys.argv[1]; out = sys.argv[2]
IDS = {
 "calories":[1008],"protein":[1003],"carbohydrates":[1005],"fiber":[1079],"sugars":[2000],"addedSugars":[1235],
 "fat":[1004],"saturatedFat":[1258],"monounsaturatedFat":[1292],"polyunsaturatedFat":[1293],"transFat":[1257],"cholesterol":[1253],
 "omega6":[1316,1269],
 "vitaminA":[1106],"vitaminC":[1162],"vitaminD":[1114],"vitaminE":[1109],"vitaminK":[1185],"thiamin":[1165],"riboflavin":[1166],
 "niacin":[1167],"pantothenicAcid":[1170],"vitaminB6":[1175],"folate":[1190,1177],"vitaminB12":[1178],"choline":[1180],
 "calcium":[1087],"iron":[1089],"magnesium":[1090],"phosphorus":[1091],"potassium":[1092],"sodium":[1093],"zinc":[1095],
 "copper":[1098],"manganese":[1101],"selenium":[1103],"iodine":[1100],
}
KEYS = list(IDS) + ["omega3"]
cats = {r["id"]: r["description"] for r in csv.DictReader(open(f"{src}/food_category.csv"))}
foods = {r["fdc_id"]: (r["description"], cats.get(r["food_category_id"], "")) for r in csv.DictReader(open(f"{src}/food.csv"))}
vals = {}
for r in csv.DictReader(open(f"{src}/food_nutrient.csv")):
    vals.setdefault(r["fdc_id"], {})[int(r["nutrient_id"])] = float(r["amount"])
rows = []
skip_cats = {"Baby Foods", "Fast Foods", "Restaurant Foods", "American Indian/Alaska Native Foods"}
for fid, (desc, cat) in foods.items():
    if cat in skip_cats: continue
    v = vals.get(fid, {})
    rec = []
    for k in KEYS:
        if k == "omega3":
            ala = v.get(1404, v.get(1270))
            parts = [x for x in (ala, v.get(1278), v.get(1272), v.get(1280)) if x is not None]
            rec.append(round(sum(parts), 4) if parts else None)
            continue
        x = next((v[i] for i in IDS[k] if i in v), None)
        rec.append(None if x is None else round(x, 4))
    rows.append([int(fid), desc, rec])
json.dump({"source": "USDA FoodData Central, SR Legacy (April 2018), public domain", "keys": KEYS, "foods": rows}, open(out, "w"), separators=(",", ":"))
print(len(rows))
