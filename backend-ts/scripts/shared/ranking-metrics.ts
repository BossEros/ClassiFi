export interface RankingMetricsAtK {
  topK: number
  evaluatedItems: number
  totalRelevantItems: number
  relevantItemsInTopK: number
  precision: number
  recall: number
}

/**
 * Computes top-K ranking metrics for a scored item list.
 *
 * Precision answers how many of the inspected top-K items are relevant.
 * Recall answers how many of all relevant items were surfaced inside top-K.
 */
export function computeRankingMetricsAtK<TItem>(
  items: TItem[],
  getScore: (item: TItem) => number,
  isRelevant: (item: TItem) => boolean,
  topK: number,
): RankingMetricsAtK {
  const sortedItems = [...items].sort((leftItem, rightItem) => getScore(rightItem) - getScore(leftItem))
  const evaluatedItems = Math.min(topK, sortedItems.length)
  const topItems = sortedItems.slice(0, evaluatedItems)
  const relevantItemsInTopK = topItems.filter(isRelevant).length
  const totalRelevantItems = sortedItems.filter(isRelevant).length
  const precision = evaluatedItems > 0 ? relevantItemsInTopK / evaluatedItems : 0
  const recall = totalRelevantItems > 0 ? relevantItemsInTopK / totalRelevantItems : 0

  return {
    topK,
    evaluatedItems,
    totalRelevantItems,
    relevantItemsInTopK,
    precision,
    recall,
  }
}
