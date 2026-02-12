/**
 * Marketplace Account entity types
 * Game-agnostic account marketplace types
 */

export interface Account {
  id: string;
  image: string;
  description: string;
  collectionLevel: number;
  price: number;
  includes: string[];
}

export interface AccountDetail {
  images: string[];
  price: number;
  collectionLevel: number;
  rpSeasons?: string[][];
  rareCostumes?: AccountItem[];
  vehicleSkins?: AccountItem[];
  weaponSkins?: AccountItem[];
  otherItems?: AccountItem[];
  reviewLink?: string;
}

export interface AccountItem {
  name: string;
  rarity: 'Mythic' | 'Legendary' | 'Epic' | 'Rare';
}
