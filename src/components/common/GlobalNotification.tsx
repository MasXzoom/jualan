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
  const [api, contextHolder] = notification.useNotification();
  const [notificationsQueue, setNotificationsQueue] = useState<NotificationItem[]>([]);
  const addNotification = useStore(state => state.addNotification);

  // Mendaftarkan fungsi addNotification ke global store
  useEffect(() => {
    addNotification((type, message, description, duration = 4.5) => {
      setNotificationsQueue(prev => [...prev, { type, message, description, duration }]);
    });
  }, [addNotification]);

  // Proses notifikasi dalam queue
  useEffect(() => {
    if (notificationsQueue.length > 0) {
      const [currentNotification, ...restNotifications] = notificationsQueue;
      
      api[currentNotification.type]({
        message: currentNotification.message,
        description: currentNotification.description,
        duration: currentNotification.duration,
        icon: iconMap[currentNotification.type],
        className: 'global-notification-item'
      });
      
      setNotificationsQueue(restNotifications);
    }
  }, [api, notificationsQueue]);

  return contextHolder;
};

export default GlobalNotification; 