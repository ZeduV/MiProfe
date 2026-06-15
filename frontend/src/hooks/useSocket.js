import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('miprofe_token');
    if (!token) return;

    socketRef.current = io('http://localhost:4000', {
      auth: { token }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const joinReserva = useCallback((reservaId) => {
    if (socketRef.current) {
      socketRef.current.emit('join-reserva', reservaId);
    }
  }, []);

  const leaveReserva = useCallback((reservaId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-reserva', reservaId);
    }
  }, []);

  const sendMessage = useCallback((data) => {
    if (socketRef.current) {
      socketRef.current.emit('nuevo-mensaje', data);
    }
  }, []);

  const sendTyping = useCallback((reservaID) => {
    if (socketRef.current) {
      socketRef.current.emit('escribiendo', { reservaID });
    }
  }, []);

  const onMessage = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('mensaje-recibido', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('mensaje-recibido', callback);
      }
    };
  }, []);

  const onTyping = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('usuario-escribiendo', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('usuario-escribiendo', callback);
      }
    };
  }, []);

  return { socket: socketRef.current, joinReserva, leaveReserva, sendMessage, sendTyping, onMessage, onTyping };
}
