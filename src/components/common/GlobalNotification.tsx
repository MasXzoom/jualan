import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import { useStore } from '../../lib/store';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

// Tipe notifikasi yang didukung
type NotificationType = 'success' | 'error' | 'info' | 'warning';

// Interface untuk objek notifikasi
interface NotificationItem {
  type: NotificationType;
  message: string;
  description?: string;
  duration?: number;
}

// Pemetaan icon untuk setiap tipe notifikasi
const iconMap = {
  success: <CheckCircle className="text-green-500" />,
  error: <XCircle className="text-red-500" />,
  warning: <AlertCircle className="text-amber-500" />,
  info: <Info className="text-blue-500" />
};

const GlobalNotification: React.FC = () => {
  const [notificationApi, contextHolder] = notification.useNotification();
  const [notificationsQueue, setNotificationsQueue] = useState<NotificationItem[]>([]);
  const addNotification = useStore(state => state.addNotification);

  // Mendaftarkan fungsi addNotification ke global store
  useEffect(() => {
    addNotification((type, message, description, duration = 4.5) => {
      console.log('GlobalNotification: Adding to queue', type, message);
      setNotificationsQueue(prev => [...prev, { type, message, description, duration }]);
    });
  }, [addNotification]);

  // Proses notifikasi dalam queue
  useEffect(() => {
    if (notificationsQueue.length > 0) {
      const [currentNotification, ...restNotifications] = notificationsQueue;
      
      console.log('GlobalNotification: Showing notification', currentNotification.type, currentNotification.message);
      
      // Metode yang benar untuk memanggil notification API
      try {
        switch(currentNotification.type) {
          case 'success':
            notificationApi.success({
              message: currentNotification.message,
              description: currentNotification.description,
              duration: currentNotification.duration,
              icon: iconMap.success,
              className: 'global-notification-item'
            });
            break;
          case 'error':
            notificationApi.error({
              message: currentNotification.message,
              description: currentNotification.description,
              duration: currentNotification.duration,
              icon: iconMap.error,
              className: 'global-notification-item'
            });
            break;
          case 'info':
            notificationApi.info({
              message: currentNotification.message,
              description: currentNotification.description,
              duration: currentNotification.duration,
              icon: iconMap.info,
              className: 'global-notification-item'
            });
            break;
          case 'warning':
            notificationApi.warning({
              message: currentNotification.message,
              description: currentNotification.description,
              duration: currentNotification.duration,
              icon: iconMap.warning,
              className: 'global-notification-item'
            });
            break;
          default:
            notificationApi.open({
              message: currentNotification.message,
              description: currentNotification.description,
              duration: currentNotification.duration,
              className: 'global-notification-item'
            });
        }
      } catch (error) {
        console.error('Error showing notification:', error);
      }
      
      setNotificationsQueue(restNotifications);
    }
  }, [notificationApi, notificationsQueue]);

  return contextHolder;
};

export default GlobalNotification; 