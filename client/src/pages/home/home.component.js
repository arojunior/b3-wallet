import React from 'react';
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
import { toCurrency } from '../../services/utils';

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
  cellPositive: {
    color: `blue`,
  },
  cellNegative: {
    color: `red`,
  },
  header: {
    margin: `20px`,
  },
});

const renderTotalVariation = (totals, classes) => {
  const totalVariation = ((totals.current - totals.price) * 100) / totals.price;

  return (
    <TableCell
      align="right"
      className={totalVariation > 0 ? classes.cellPositive : classes.cellNegative}
    >
      <strong>{totalVariation.toFixed(2)}%</strong>
    </TableCell>
  );
};

const HomeComponent = ({
  wallet,
  values,
  totals,
  isSocketConnected,
  isImportingData,
  handleChangeValues,
  handleImportData,
}) => {
  const classes = useStyles();

  return (
    <TableContainer component={Paper}>
      <Grid className={classes.header}>
        {wallet.updated ? (
          <h2>Última atualização: {new Date(wallet.updated).toLocaleString(`pt-BR`)}</h2>
        ) : (
          <span>
            <strong>
              <i>**use a importação de dados para visualizar a sua carteira**</i>
            </strong>
            <br />
            <br />
          </span>
        )}
      </Grid>
      <Grid className={classes.header}>
        <TextField
          name="user"
          onChange={handleChangeValues}
          label="CPF"
          value={values.user || ``}
        />
        <TextField
          name="pass"
          onChange={handleChangeValues}
          type="password"
          label="Senha"
          value={values.pass || ``}
        />
        <Button variant="outlined" onClick={handleImportData}>
          Importar dados
        </Button>
      </Grid>
      <Grid>
        <span>server: {isSocketConnected ? `conectado` : `desconectado`}</span>
        <span>{isImportingData && ` | importando dados... aguarde...`}</span>
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
          {wallet.data.map((row) => {
            const diff = row.totalCurrent - row.totalPrice;
            return (
              <TableRow key={row.ticker}>
                <TableCell component="th" scope="row">
                  {row.ticker}
                </TableCell>
                <TableCell align="right">{row.quantity}</TableCell>
                <TableCell align="right">{toCurrency.format(row.price)}</TableCell>
                <TableCell align="right">{toCurrency.format(row.totalPrice)}</TableCell>
                <TableCell align="right">{toCurrency.format(row.currentPrice)}</TableCell>
                <TableCell
                  align="right"
                  className={row.variation > 0 ? classes.cellPositive : classes.cellNegative}
                >
                  {row.variation.toFixed(2)}%
                </TableCell>
                <TableCell align="right">{toCurrency.format(row.totalCurrent)}</TableCell>
                <TableCell
                  align="right"
                  className={diff > 0 ? classes.cellPositive : classes.cellNegative}
                >
                  {toCurrency.format(diff)}
                </TableCell>
                <TableCell
                  align="right"
                  className={row.totalVariation > 0 ? classes.cellPositive : classes.cellNegative}
                >
                  {row.totalVariation.toFixed(2)}%
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow>
            <TableCell>
              <strong>{wallet.data ? `${wallet.data.length} ativos` : null}</strong>
            </TableCell>
            <TableCell />
            <TableCell />
            <TableCell align="right">
              <strong>{toCurrency.format(totals.price)}</strong>
            </TableCell>
            <TableCell />
            <TableCell />
            <TableCell align="right">
              <strong>{toCurrency.format(totals.current)}</strong>
            </TableCell>
            <TableCell
              align="right"
              className={totals.diff > 0 ? classes.cellPositive : classes.cellNegative}
            >
              <strong>{toCurrency.format(totals.diff)}</strong>
            </TableCell>
            {renderTotalVariation(totals, classes)}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default HomeComponent;
