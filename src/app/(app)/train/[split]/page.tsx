import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SplitPageClient } from "@/components/train/SplitPageClient";
import type { Split } from "@/lib/types";
import { SPLITS } from "@/lib/types";

export function generateStaticParams() {
  return SPLITS.map((split) => ({ split: encodeURIComponent(split) }));
}

export default async function SplitPage({ params }: { params: Promise<{ split: string }> }) {
  const { split: rawSplit } = await params;
  const split = decodeURIComponent(rawSplit) as Split;

  if (!SPLITS.includes(split)) {
    return (
      <Card>
        <EmptyState icon="⚠" text="Unknown split." />
      </Card>
    );
  }

  return <SplitPageClient split={split} />;
}
