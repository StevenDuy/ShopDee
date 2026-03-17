import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

if (typeof window !== 'undefined') {
  window.Pusher = Pusher;

  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER;

  if (pusherKey && pusherCluster) {
    window.Echo = new Echo({
      broadcaster: 'pusher',
      key: pusherKey,
      cluster: pusherCluster,
      forceTLS: true,
    });
  } else {
    console.warn("Pusher configuration missing. Real-time features (Chat, Notifications) will not work.");
  }
}

export default typeof window !== 'undefined' ? window.Echo : undefined;