export type Status = "not_purchased" | "purchased";
export type Priority = "high" | "medium" | "low";

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  price_kzt: number;
  product_url: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  status: Status;
  priority: Priority;
  is_active: boolean;
  owner_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WishlistItemWithOwner extends WishlistItem {
  owner?: Profile | null;
}
