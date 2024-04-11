import { GetServerSideProps } from 'next';
import { Box, Typography, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import pool from "../../utils/db";
import NavBar from '../../components/NavBar';

type RoundCount = {
  year: number;
  count: number;
};

type Driver = {
  id: number;
  name: string;
  numero: number;
  rounds?: RoundCount[];
};

type DriverDetailsProps = {
  driver: Driver;
};

const DriverDetails = ({ driver }: DriverDetailsProps) => {
  return (
    <>
      <NavBar />
      <Box p={4}>
        <Typography variant="h4">{driver.name}</Typography>
        <Typography variant="subtitle1">Numero: {driver.numero}</Typography>

        <Box mt={4}>
          <Typography variant="h5">Round Counts Per Year</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Year</TableCell>
                <TableCell>Round Count</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {driver.rounds?.map((round) => (
                <TableRow key={round.year}>
                  <TableCell>{round.year}</TableCell>
                  <TableCell>{round.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </>
  );
};

export default DriverDetails;

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { id } = params;
  
  // Fetch driver details from the database based on the ID
  const [driverRows] = await pool.query('SELECT * FROM driver WHERE DriverID = ?', [id]);
  
  if (driverRows.length === 0) {
    return {
      notFound: true, // Return 404 page if driver not found
    };
  }
  
  // Fetch round counts per year for the driver
  const [roundRows] = await pool.query(`
    SELECT 
      YEAR(r.Date) AS year,
      COUNT(*) AS totalRaces
    FROM round r
    JOIN rounddriver rd ON r.RoundID = rd.RoundID
    JOIN driver d ON rd.DriverID = d.DriverID
    WHERE d.DriverID = ?
    GROUP BY year;
  `, [id]);
  
  const driver: Driver = {
    id: driverRows[0].DriverID,
    name: driverRows[0].Name,
    numero: driverRows[0].Numero,
    rounds: roundRows.map((row: any) => ({
      year: row.year,
      count: row.totalRaces  // Use row.totalRaces instead of row.count
    }))
  };
  
  return { props: { driver } };
};

