import React, { useEffect } from 'react';

interface ToastProps {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'warning';
    onClose: () => void;
}

export const NotifyToast: React.FC<ToastProps> = ({ show, message, type, onClose }) => {
    useEffect(() => {
        if (show) {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    const backgroundColor = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107'
    }[type];

    if (!show) return null;

    return (
        <div
        style={{
            position: 'fixed',
            top: '10px',
            right: '300px',
            backgroundColor,
            color: type === 'warning' ? '#000' : '#fff',
            padding: '12px 24px',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: 1060,
            animation: 'slideIn 0.3s ease-out',
        }}
        >
        {message}
        </div>
    );
};