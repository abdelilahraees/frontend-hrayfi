// Backend Spring Boot (voir hrayfi-backend). À adapter pour un déploiement.
export const API_URL = 'http://localhost:8080';
// Endpoint STOMP : SockJS expose aussi un WebSocket brut sous /ws/websocket
export const WS_URL = 'ws://localhost:8080/ws/websocket';

/** Les photos envoyées sont servies par le backend (/uploads/...), les autres par le front. */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return '/img/hero-main.jpg';
  return url.startsWith('/uploads/') ? API_URL + url : url;
}
