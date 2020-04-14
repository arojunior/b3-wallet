import React from "react";
import styled from "styled-components";
import { useTable } from "react-table";
import wallet from "./data/wallet.json";

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`;

const Table = ({ columns, data }) => {
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headers,
    rows,
    prepareRow
  } = useTable({
    columns,
    data
  });

  // Render the UI for your table
  return (
    <table {...getTableProps()}>
      <thead>
        <tr>
          {headers.map(column => (
            <th {...column.getHeaderProps()}>{column.render("Header")}</th>
          ))}
        </tr>
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => {
                return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const getHeaders = list =>
  Object.keys(list[0]).map(key => ({
    Header: key,
    accessor: key
  }));

const DynamicTable = ({ list, title }) => {
  const columns = React.useMemo(() => getHeaders(list), []);
  const data = React.useMemo(() => list, []);

  return (
    <p>
      <h2>{title}</h2>
      <Table columns={columns} data={data} />
    </p>
  );
};

const App = () => {
  return (
    <Styles>
      <DynamicTable list={wallet} title="Carteira" />
    </Styles>
  );
}

export default App;
