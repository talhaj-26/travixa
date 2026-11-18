export const ONLINE_IMAGES = {
  HERO_BG:
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
  HOTEL_DEFAULT:
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
  RESTAURANT_DEFAULT:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  TOUR_DEFAULT:
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
  AVATAR_PLACEHOLDER:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
};

export function handleImageError(
  event: Event,
  fallbackUrl: string = ONLINE_IMAGES.HOTEL_DEFAULT,
): void {
  const target = event.target as HTMLImageElement;
  if (target) {
    target.src = fallbackUrl;
  }
}
