import { GetServerSideProps } from 'next';
import { Box, Typography, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import pool from "../../utils/db";
import NavBar from '../../components/NavBar';

type RoundCount = {
  year: number;
  count: number;
  top3: number;
  top5: number;
  top10: number;
  victories: number;
  polePositions: number;
};

type Team = {
  id: number;
  name: string;
};

type Driver = {
  id: number;
  name: string;
  numero: number;
  team: Team | null;
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

        {driver.team && (
          <Box mt={2}>
            <Typography variant="h6">Team</Typography>
            <Typography variant="body1">{driver.team.name}</Typography>
          </Box>
        )}

        <Box mt={4}>
          <Typography variant="h5">Round Statistics Per Year</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Year</TableCell>
                <TableCell>Round Count</TableCell>
                <TableCell>Victories</TableCell>
                <TableCell>Top 3</TableCell>
                <TableCell>Top 5</TableCell>
                <TableCell>Top 10</TableCell>
                <TableCell>Pole Positions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {driver.rounds?.map((round) => (
                <TableRow key={round.year}>
                  <TableCell>{round.year}</TableCell>
                  <TableCell>{round.count}</TableCell>
                  <TableCell>{round.victories}</TableCell>
                  <TableCell>{round.top3}</TableCell>
                  <TableCell>{round.top5}</TableCell>
                  <TableCell>{round.top10}</TableCell>
                  <TableCell>{round.polePositions}</TableCell>
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
      notFound: true,
    };
  }
  
  // Fetch round statistics per year for the driver
  const [roundRows] = await pool.query(`
    SELECT 
    YEAR(r.Date) AS year,
    COUNT(*) AS totalRaces,
    SUM(CASE WHEN rd.position <= 3 THEN 1 ELSE 0 END) AS top3,
    SUM(CASE WHEN rd.position <= 5 THEN 1 ELSE 0 END) AS top5,
    SUM(CASE WHEN rd.position <= 10 THEN 1 ELSE 0 END) AS top10,
    SUM(CASE WHEN rd.position = 1 THEN 1 ELSE 0 END) AS victories,
    SUM(CASE WHEN rd.pole_position = 1 THEN 1 ELSE 0 END) AS polePositions
    FROM round r
    JOIN rounddriver rd ON r.RoundID = rd.RoundID
    JOIN driver d ON rd.DriverID = d.DriverID
    WHERE d.DriverID = ?
    GROUP BY year;
  `, [id]);

  const [teamRows] = await pool.query(`
    SELECT t.TeamID AS id, t.Name
    FROM team t
    JOIN driver dt ON t.TeamID = dt.TeamID
    WHERE dt.DriverID = ?
  `, [id]);

  const driver: Driver = {
    id: driverRows[0].DriverID,
    name: driverRows[0].Name,
    numero: driverRows[0].Numero,
    rounds: roundRows.map((row: any) => ({
      year: row.year,
      count: row.totalRaces,
      top3: row.top3,
      top5: row.top5,
      top10: row.top10,
      victories: row.victories,
      polePositions: row.polePositions
    })),
    team: teamRows.length > 0 ? {
      id: teamRows[0].id,
      name: teamRows[0].Name
    } : null
  };
  
  return { props: { driver } };
};
