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
  top3: number;
  top5: number;
  top10: number;
  polePositions: number;
  victories: number;
};

type Race = {
  id: number;
  roundName: string;
  date: string;
  position: number;
};

type DriverDetailsProps = {
  driver: Driver;
  races: Race[];
};

const DriverDetails = ({ driver, races }: DriverDetailsProps) => {
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

        <Box mt={4}>
          <Typography variant="h5">Top Finishes</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Victories</TableCell>
                <TableCell>Top 3</TableCell>
                <TableCell>Top 5</TableCell>
                <TableCell>Top 10</TableCell>
                <TableCell>Pole Positions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{driver.victories}</TableCell>
                <TableCell>{driver.top3}</TableCell>
                <TableCell>{driver.top5}</TableCell>
                <TableCell>{driver.top10}</TableCell>
                <TableCell>{driver.polePositions}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Box mt={4}>
          <Typography variant="h5">Last 10 Races</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Race Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Position</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {races.map((race) => (
                <TableRow key={race.id}>
                  <TableCell>{race.roundName}</TableCell>
                  <TableCell>{race.date}</TableCell>
                  <TableCell>{race.position}</TableCell>
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

  // Fetch top finishes for the driver
  const [topRows] = await pool.query(`
    SELECT 
    SUM(CASE WHEN position <= 3 THEN 1 ELSE 0 END) AS top3,
    SUM(CASE WHEN position <= 5 THEN 1 ELSE 0 END) AS top5,
    SUM(CASE WHEN position <= 10 THEN 1 ELSE 0 END) AS top10,
    SUM(CASE WHEN pole_position = 1 THEN 1 ELSE 0 END) AS polePositions,
    SUM(CASE WHEN position = 1 THEN 1 ELSE 0 END) AS victories
    FROM rounddriver
    WHERE DriverID = ?;
  `, [id]);

  // Fetch last 10 races for the driver
  const [raceRows] = await pool.query(`
    SELECT 
    r.RoundID AS id,
    r.Name AS roundName,
    r.Date,
    rd.position
    FROM round r
    JOIN rounddriver rd ON r.RoundID = rd.RoundID
    WHERE rd.DriverID = ?
    ORDER BY r.Date DESC
    LIMIT 10;
  `, [id]);
  
  const driver: Driver = {
    id: driverRows[0].DriverID,
    name: driverRows[0].Name,
    numero: driverRows[0].Numero,
    rounds: roundRows.map((row: any) => ({
      year: row.year,
      count: row.totalRaces
    })),
    top3: topRows[0].top3,
    top5: topRows[0].top5,
    top10: topRows[0].top10,
    polePositions: topRows[0].polePositions,
    victories: topRows[0].victories
  };

  const races: Race[] = raceRows.map((row: any) => ({
    id: row.id,
    roundName: row.roundName,
    date: new Date(row.Date).toDateString(),
    position: row.position
  }));

  return { props: { driver, races } };
};
