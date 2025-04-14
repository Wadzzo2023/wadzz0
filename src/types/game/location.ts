export interface Location {
  id: string | number;
  lat: number;
  lng: number;
  title: string;
  description: string;
  brand_name: string;
  url: string;
  image_url: string;
  collected: boolean;

  collection_limit_remaining: number;
  auto_collect: boolean;
  brand_image_url: string;
  brand_id: string;
}

export interface ConsumedLocation extends Location {
  modal_url: string;
  viewed: boolean;
}
