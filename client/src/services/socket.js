import openSocket from 'socket.io-client';

const socket = openSocket('http://localhost:4000', { transports: ['websocket'] });

socket.on('connected', () => {
  console.log('connected to server')
});

export default socket;