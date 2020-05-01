import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import socket from '../services/socket';

const toCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
  cellPositive: {
    color: 'blue'
  },
  cellNegative: {
    color: 'red'
  },
  header: {
     margin: '20px',
  } 
});

const renderTotalVariacao = (totals, classes) => {
    const total_variacao = ((totals.atual - totals.aquisicao) * 100 ) / totals.aquisicao;

    return (
      <TableCell align="right" className={total_variacao > 0 ? classes.cellPositive : classes.cellNegative}>
        <strong>{total_variacao.toFixed(2)}%</strong>
      </TableCell>
    )
}

export default () => {
  const [wallet, setWallet] = useState({});
  const [values, setValues] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);
  const [importingData, setImportingData] = useState(false);
  const classes = useStyles();
  const totals = {
    aquisicao: 0,
    atual: 0,
    diff: 0,
  };

  useEffect(() => {
    socket.emit('getWallet');
    socket.emit('getCredentials');
    socket.emit('updateWallet');

    socket.on('wallet', newWallet => {
      setWallet(newWallet);
    });

    socket.on('walletUpdated', newWallet => {
      setWallet(newWallet);
    });

    socket.on('credentials', credentials => {
      setValues(credentials);
    });

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('dataImported', () => {
      setImportingData(false);
    });    
  }, [])

  const handleChangeValues = event => {
    setValues({...values, [event.target.name]: event.target.value });
  }

  const importData = () => {
    socket.emit('importData', values);
    setImportingData(true);
  }

  return (
    <TableContainer component={Paper}>
      <Grid className={classes.header}>
        {wallet.updated 
          ? <h2>Última atualização: {new Date(wallet.updated).toLocaleString('pt-BR')}</h2>
          : <span><strong><i>**use a importação de dados para visualizar a sua carteira**</i></strong><br /><br /></span>
        }
      </Grid>
      <Grid className={classes.header}>
        <TextField name="user" onChange={handleChangeValues} label="CPF" value={values.user || ``} />
        <TextField name="pass" onChange={handleChangeValues} type="password" label="Senha" value={values.pass || ``} />
        <Button variant="outlined" onClick={importData}>Importar dados</Button>
      </Grid>
      <Grid>
        <span>server: {socketConnected ? `conectado`: `desconectado`}</span>
        <span>{importingData && ` | importando dados... aguarde...`}</span>
      </Grid>
      <Table className={classes.table} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Ticker</TableCell>
            <TableCell align="right">Quantidade</TableCell>
            <TableCell align="right">Preço médio</TableCell>
            <TableCell align="right">Total aquisição</TableCell>
            <TableCell align="right">Valor atual</TableCell>
            <TableCell align="right">Variação dia</TableCell>
            <TableCell align="right">Total atual</TableCell>
            <TableCell align="right">Diferença</TableCell>
            <TableCell align="right">Variação total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {wallet && wallet.data && wallet.data.map((row) => {
            const diff = row.total_atual - row.total_aquisicao;
            totals.aquisicao +=  row.total_aquisicao;
            totals.atual +=  row.total_atual;
            totals.diff +=  diff;
            return (
              <TableRow key={row.ticker}>
                <TableCell component="th" scope="row">
                  {row.ticker}
                </TableCell>
                <TableCell align="right">{row.quantidade}</TableCell>
                <TableCell align="right">{toCurrency.format(row.preco_medio)}</TableCell>
                <TableCell align="right">{toCurrency.format(row.total_aquisicao)}</TableCell>
                <TableCell align="right">{toCurrency.format(row.preco_atual)}</TableCell>
                <TableCell align="right" className={row.variacao_dia > 0 ? classes.cellPositive : classes.cellNegative}>
                  {row.variacao_dia.toFixed(2)}%
                </TableCell>
                <TableCell align="right">{toCurrency.format(row.total_atual)}</TableCell>
                <TableCell align="right" className={diff > 0 ? classes.cellPositive : classes.cellNegative}>
                  {toCurrency.format(diff)}
                </TableCell>
                <TableCell align="right" className={row.variacao_total > 0 ? classes.cellPositive : classes.cellNegative}>
                  {row.variacao_total.toFixed(2)}%
                </TableCell>
              </TableRow>
            )
          })}
          <TableRow>
            <TableCell><strong>{wallet.data ?  `${wallet.data.length} ativos` : null}</strong></TableCell>
            <TableCell />
            <TableCell />
            <TableCell align="right"><strong>{toCurrency.format(totals.aquisicao)}</strong></TableCell>
            <TableCell />
            <TableCell />
            <TableCell align="right"><strong>{toCurrency.format(totals.atual)}</strong></TableCell>
            <TableCell align="right" className={totals.diff > 0 ? classes.cellPositive : classes.cellNegative}>
              <strong>{toCurrency.format(totals.diff)}</strong>
            </TableCell>
            {renderTotalVariacao(totals, classes)}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
