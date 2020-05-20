import socket from '../../services/socket';

export const withSocket = ({ setWallet, setValues, setSocketConnected, setImportingData }) => {
  socket.emit(`getWallet`);
  socket.emit(`getCredentials`);
  socket.emit(`updateWallet`);

  socket.on(`wallet`, (newWallet) => {
    setWallet(newWallet);
  });

  socket.on(`walletUpdated`, (newWallet) => {
    setWallet(newWallet);
  });

  socket.on(`credentials`, (credentials) => {
    setValues(credentials);
  });

  socket.on(`connect`, () => {
    setSocketConnected(true);
  });

  socket.on(`disconnect`, () => {
    setSocketConnected(false);
  });

  socket.on(`dataImported`, () => {
    setImportingData(false);
  });
};

export const sumTotals = (wallet = []) => {
  return wallet.reduce(
    (acc, item) => ({
      price: acc.price + item.totalPrice,
      current: acc.current + item.totalCurrent,
      diff: acc.diff + (item.totalCurrent - item.totalPrice),
    }),
    {
      price: 0,
      current: 0,
      diff: 0,
    },
  );
};
