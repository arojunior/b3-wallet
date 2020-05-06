import React, { useState, useEffect } from 'react';
import { withSocket, sumTotals } from './home.service';
import socket from '../../services/socket';

const HomeContainer = ({ Component }) => {
  const [wallet, setWallet] = useState({ data: [] });
  const [values, setValues] = useState({});
  const [isSocketConnected, setSocketConnected] = useState(false);
  const [isImportingData, setImportingData] = useState(false);

  useEffect(() => {
    withSocket({ setWallet, setValues, setSocketConnected, setImportingData });
  }, []);

  const totals = sumTotals(wallet.data);

  const handleChangeValues = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value });
  };

  const handleImportData = () => {
    socket.emit(`importData`, values);
    setImportingData(true);
  };

  return (
    <Component
      wallet={wallet}
      values={values}
      totals={totals}
      isSocketConnected={isSocketConnected}
      isImportingData={isImportingData}
      handleChangeValues={handleChangeValues}
      handleImportData={handleImportData}
    />
  );
};

export default HomeContainer;
