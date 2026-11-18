import { getInsightPosts } from "@/lib/insights";
import { InsightsSectionView } from "./InsightsSectionView";

/**
 * Server wrapper: reads the markdown articles in client/content/insights and
 * hands them to the (client-side) filterable view. Drop-in `<InsightsSection />`.
 */
export function InsightsSection({ showAll = false }: { showAll?: boolean }) {
  return <InsightsSectionView posts={getInsightPosts()} showAll={showAll} />;
}
