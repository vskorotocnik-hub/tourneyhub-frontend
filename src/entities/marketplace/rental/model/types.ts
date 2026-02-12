/**
 * Marketplace Rental entity types
 */

export interface RentalAccount {
  id: string;
  image: string;
  description: string;
  collectionLevel: number;
  pricePerHour: number;
  minHours: number;
  rentalTerms: string;
}
