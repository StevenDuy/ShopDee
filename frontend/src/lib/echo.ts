import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    
    window.Echo = new Echo({
      broadcaster: 'pusher',
      key: pusherKey,
      cluster: pusherCluster,
      forceTLS: true,
      authorizer: (channel: any) => {
        return {
          authorize: (socketId: string, callback: Function) => {
            const auth = localStorage.getItem('shopdee-auth');
            let token = '';
            try {
              if (auth) {
                const { state } = JSON.parse(auth);
                token = state.token || '';
              }
            } catch (e) {
              console.error("Echo Auth Error:", e);
            }

            axios.post(`${apiUrl}/broadcasting/auth`, {
              socket_id: socketId,
              channel_name: channel.name
            }, {
              headers: { Authorization: `Bearer ${token}` }
            })
            .then(response => {
              callback(false, response.data);
            })
            .catch(error => {
              callback(true, error);
            });
          }
        };
      }
    });
  } else {
    console.warn("Pusher configuration missing. Real-time features (Chat, Notifications) will not work.");
  }
}

export default typeof window !== 'undefined' ? window.Echo : undefined;