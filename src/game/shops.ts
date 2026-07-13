import { SHOP_PURCHASE_PRICE } from "../utils/constants";

export type ShopId = "trail-shop";

export type Shop = {
  id: ShopId;
  name: string;
  purchasePrice: number;
};

export const SHOPS = [
  {
    id: "trail-shop",
    name: "Trail Shop",
    purchasePrice: SHOP_PURCHASE_PRICE,
  },
] as const satisfies readonly Shop[];

export function getShop(shopId: ShopId): Shop {
  return SHOPS.find((shop) => shop.id === shopId) ?? SHOPS[0];
}
