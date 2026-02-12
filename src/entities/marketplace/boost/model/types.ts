/**
 * Marketplace Boost entity types
 */

export interface Booster {
  id: string;
  image: string;
  nickname: string;
  rating: number;
  completedOrders: number;
  price: number;
  description: string;
  platform: 'any' | 'android' | 'ios';
}
