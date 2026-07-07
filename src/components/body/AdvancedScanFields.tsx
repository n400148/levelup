import type { AdvancedScanData } from "@/lib/types";
import { Input, Label } from "@/components/ui/Input";

export type Key = keyof AdvancedScanData;

export interface FieldMeta {
  key: Key;
  label: string;
  unit?: string;
  placeholder?: string;
}

export const ADVANCED_FIELD_GROUPS: { title: string; fields: FieldMeta[] }[] = [
  {
    title: "Composition",
    fields: [
      { key: "skeletalMuscleMass", label: "Skeletal Muscle Mass", unit: "lb" },
      { key: "proteinMass", label: "Protein Mass", unit: "lb" },
      { key: "mineralMass", label: "Mineral Mass", unit: "lb" },
      { key: "totalBodyWater", label: "Total Body Water", unit: "lb" },
      { key: "bodyFatMass", label: "Body Fat Mass", unit: "lb" },
      { key: "subcutaneousFatMass", label: "Subcutaneous Fat Mass", unit: "lb" },
    ],
  },
  {
    title: "Visceral Fat",
    fields: [
      { key: "visceralFatMass", label: "Visceral Fat Mass", unit: "lb" },
      { key: "visceralFatLevel", label: "Visceral Fat Level", placeholder: "1–59 scale" },
      { key: "visceralFatArea", label: "Visceral Fat Area", unit: "cm²" },
    ],
  },
  {
    title: "Fluids",
    fields: [
      { key: "icf", label: "Intracellular Fluid", unit: "lb" },
      { key: "ecf", label: "Extracellular Fluid", unit: "lb" },
    ],
  },
  {
    title: "Energy",
    fields: [
      { key: "bmr", label: "Basal Metabolic Rate", unit: "kcal" },
      { key: "tee", label: "Total Energy Expenditure", unit: "kcal" },
    ],
  },
  {
    title: "Other",
    fields: [
      { key: "bioAge", label: "Bio Age", unit: "yrs" },
      { key: "bwiScore", label: "Bio Wellness Index", placeholder: "BWI score" },
    ],
  },
];

export function AdvancedScanFields({
  value,
  onChange,
}: {
  value: AdvancedScanData;
  onChange: (patch: Partial<AdvancedScanData>) => void;
}) {
  return (
    <div>
      {ADVANCED_FIELD_GROUPS.map((group) => (
        <div key={group.title} className="mb-3.5 last:mb-0">
          <div className="eyebrow mb-1.5">{group.title}</div>
          <div className="grid grid-cols-2 gap-2">
            {group.fields.map((field) => (
              <div key={field.key}>
                <Label>{field.unit ? `${field.label} (${field.unit})` : field.label}</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={value[field.key] ?? ""}
                  placeholder={field.placeholder ?? "0"}
                  onChange={(e) =>
                    onChange({ [field.key]: e.target.value ? parseFloat(e.target.value) : null })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
