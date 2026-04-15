// ─── Trading Post Config ─────────────────────────────────────────────────────

export const TRADING_CONFIG = {
  /** Auction duration in milliseconds (24 hours) */
  AUCTION_DURATION_MS: 24 * 60 * 60 * 1000,
  /** Seller fee percentage (seller receives 100 - this %) */
  SELLER_FEE_PERCENT: 5,
  /** Packs whose quizlets cannot be listed for trading */
  BLOCKED_PACKS: ["mystical"] as readonly string[],
} as const;

/** Minimum listing price = the quizlet's system sell value */
export function getMinPrice(sellValue: number): number {
  return sellValue;
}

/** Calculate coins the seller receives after fee deduction */
export function calculateSellerProceeds(salePrice: number): number {
  return Math.floor(salePrice * (1 - TRADING_CONFIG.SELLER_FEE_PERCENT / 100));
}
