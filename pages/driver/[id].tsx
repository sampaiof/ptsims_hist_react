import { GetServerSideProps } from 'next';
import { Box, Typography, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import pool from "../../utils/db";
import NavBar from '../../components/NavBar';

type RoundCount = {
  year: number;
  count: number;
};

type Competition = {
  id: number;
  name: string;
  date: string;
};

type Driver = {
  id: number;
  name: string;
  numero: number;
  rounds?: RoundCount[];
  lastRaces?: LastRace[];
  lastCompetitions?: Competition[];
  top3?: number;
  top5?: number;
  polePositions?: number;
  victories?: number;
};

type DriverDetailsProps = {
  driver: Driver;
};

type LastRace = {
  raceName: string;
  date: string;
  position: number;
};

const DriverDetails = ({ driver }: DriverDetailsProps) => {
  return (
    <>
      <NavBar />
      <Box p={4}>
        <Typography variant="h4">{driver.name}</Typography>
        <Typography variant="subtitle1">Numero: {driver.numero}</Typography>

        {/* Round Counts Per Year Table */}
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

        {/* Last 10 Races Table */}
        <Box mt={4}>
          <Typography variant="h5">Last 10 Races</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Race</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Position</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {driver.lastRaces?.map((race) => (
                <TableRow key={race.raceName}>
                  <TableCell>{race.raceName}</TableCell>
                  <TableCell>{race.date}</TableCell>
                  <TableCell>{race.position}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Last 4 Competitions Table */}
        <Box mt={4}>
          <Typography variant="h5">Last 4 Competitions</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Competition</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {driver.lastCompetitions?.map((competition) => (
                <TableRow key={competition.id}>
                  <TableCell>{competition.name}</TableCell>
                  <TableCell>{competition.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Additional Driver Stats */}
        <Box mt={4}>
          <Typography variant="h5">Additional Stats</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Top 3</TableCell>
                <TableCell>Top 5</TableCell>
                <TableCell>Pole Positions</TableCell>
                <TableCell>Victories</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{driver.top3}</TableCell>
                <TableCell>{driver.top5}</TableCell>
                <TableCell>{driver.polePositions}</TableCell>
                <TableCell>{driver.victories}</TableCell>
              </TableRow>
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

  // Fetch last 10 races for the driver
  const [raceRows] = await pool.query(`
    SELECT r.Name AS raceName, r.Date, rd.position
    FROM round r
    JOIN rounddriver rd ON r.RoundID = rd.RoundID
    JOIN driver d ON rd.DriverID = d.DriverID
    WHERE d.DriverID = ?
    ORDER BY r.Date DESC
    LIMIT 10;
  `, [id]);

  // Fetch last 4 competitions for the driver
  const [competitionRows] = await pool.query(`
    SELECT c.CompetitionID AS id, c.Name, c.Date
    FROM competition c
    JOIN round r ON c.CompetitionID = r.CompetitionID
    JOIN rounddriver rd ON r.RoundID = rd.RoundID
    JOIN driver d ON rd.DriverID = d.DriverID
    WHERE d.DriverID = ?
    GROUP BY c.CompetitionID
    ORDER BY c.Date DESC
    LIMIT 4;
  `, [id]);

  // Fetch additional stats for the driver
  const [statsRows] = await pool.query(`
    SELECT 
      SUM(CASE WHEN rd.position <= 3 THEN 1 ELSE 0 END) AS top3,
      SUM(CASE WHEN rd.position <= 5 THEN 1 ELSE 0 END) AS top5,
      SUM(CASE WHEN rd.position = 1 THEN 1 ELSE 0 END) AS polePositions,
      SUM(CASE WHEN rd.position = 1 THEN 1 ELSE 0 END) AS victories
    FROM rounddriver rd
    WHERE rd.DriverID = ?;
  `, [id]);

  const driver: Driver = {
    id: driverRows[0].DriverID,
    name: driverRows[0].Name,
    numero: driverRows[0].Numero,
    rounds: roundRows.map((row: any) => ({
      year: row.year,
      count: row.totalRaces
    })),
    lastRaces: raceRows.map((row: any) => ({
      raceName: row.raceName,
      date: new Date (row.Date).toDateString(),
      position: row.position
    })),
    lastCompetitions: competitionRows.map((row: any) => ({
      id: row.id,
      name: row.Name,
      date: new Date(row.Date).toDateString()
    })),
    top3: statsRows[0].top3,
    top5: statsRows[0].top5,
    polePositions: statsRows[0].polePositions,
    victories: statsRows[0].victories,
  };
  
  return { props: { driver } };
};
