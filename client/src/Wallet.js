import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import wallet from "./data/wallet.json";

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
  bold: {
    fontWeight: 'bold'
  }
});

const renderTotalVariacao = (totals, classes) => {
    const total_variacao = ((totals.atual - totals.aquisicao) * 100 ) / totals.aquisicao;

    return (
      <TableCell align="right" className={[total_variacao > 0 ? classes.cellPositive : classes.cellNegative, classes.bold]}>
        {total_variacao.toFixed(2)}%
      </TableCell>
    )
}

export default () => {
  const classes = useStyles();
  const totals = {
    aquisicao: 0,
    atual: 0,
    diff: 0,
  };

  return (
    <TableContainer component={Paper}>
      <h2>Última atualização: {new Date(wallet.updated).toLocaleString('pt-BR')}</h2>
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
            <TableCell />
            <TableCell />
            <TableCell />
            <TableCell align="right" className={classes.bold}>{toCurrency.format(totals.aquisicao)}</TableCell>
            <TableCell />
            <TableCell />
            <TableCell align="right" className={classes.bold}>{toCurrency.format(totals.atual)}</TableCell>
            <TableCell align="right" className={[totals.diff > 0 ? classes.cellPositive : classes.cellNegative, classes.bold]}>
              {toCurrency.format(totals.diff)}
            </TableCell>
            {renderTotalVariacao(totals, classes)}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
