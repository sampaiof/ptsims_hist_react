import { Box, Typography, List, ListItem } from "@mui/material";
import { GetServerSideProps } from 'next';
import pool from "../../utils/db";
import NavBar from '../../components/NavBar';

type Round = {
  id: number;
  name: string;
  date: string;
};

type Driver = {
  id: number;
  name: string;
  numero: number;
  points: number;
};

type Competition = {
  id: number;
  name: string;
  rounds: Round[];
  drivers: Driver[];
};

type CompetitionProps = {
  competition: Competition;
  driverPoints: Record<number, number>;  // Updated this line
};

export default function CompetitionPage({ competition, driverPoints }: CompetitionProps) {
  return (
    <>
      <NavBar />
      <Box p={4}>
        <Typography variant="h4">{competition.name}</Typography>
        
        <Typography variant="h5" mt={4}>Rounds</Typography>
        <List>
          {competition.rounds.map((round) => (
            <ListItem key={round.id}>
              <Typography variant="body1">{round.name} - {round.date}</Typography>
            </ListItem>
          ))}
        </List>

        <Typography variant="h5" mt={4}>Drivers</Typography>
        <List>
          {competition.drivers.map((driver) => (
            <ListItem key={driver.id}>
              <Typography variant="body1">{driver.name} - {driver.numero} - Points: {driverPoints[driver.id]}</Typography>
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { id } = params;

  // Fetch competition details from the database based on the ID
  const [competitionRows] = await pool.query('SELECT * FROM competition WHERE CompetitionID = ?', [id]);

  if (competitionRows.length === 0) {
    return {
      notFound: true,
    };
  }

  // Fetch rounds associated with the competition
  const [roundRows] = await pool.query('SELECT * FROM round WHERE CompetitionID = ?', [id]);

  // Fetch drivers associated with the competition
  const [driverRows] = await pool.query(`
    SELECT d.DriverID AS id, d.Name, d.Numero
    FROM driver d 
    JOIN competitiondriver cd ON d.DriverID = cd.DriverID 
    WHERE cd.CompetitionID =  ?
  `, [id]);

  const competition: Competition = {
    id: competitionRows[0].CompetitionID,
    name: competitionRows[0].Name,
    rounds: roundRows.map((row: any) => ({
      id: row.RoundID,
      name: row.Name,
      date: new Date(row.Date).toDateString(),
    })),
    drivers: driverRows.map((row: any) => ({
      id: row.id,
      name: row.Name,
      numero: row.Numero,
      points: 0,  // Default points to 0
    })),
  };

  const driverPoints: Record<number, number> = {};

  for (const driver of competition.drivers) {
    const [pointsRows] = await pool.query(`
      SELECT rd.position
      FROM rounddriver rd
      JOIN round r ON rd.RoundID = r.RoundID
      WHERE rd.DriverID = ? AND r.CompetitionID = ?
    `, [driver.id, id]);

    let totalPoints = 0;
    for (const row of pointsRows) {
      totalPoints += getPointsByPosition(row.position);
    }

    driver.points = totalPoints;  // Assign the calculated points to the driver object
    driverPoints[driver.id] = totalPoints;
  }

  // Sort the drivers by points in descending order
  competition.drivers.sort((a, b) => b.points - a.points);

  return { props: { competition, driverPoints } };
};

const getPointsByPosition = (position: number): number => {
  const pointsMap = {
    1: 50,
    2: 45,
    3: 40,
    4: 32,
    5: 30,
    6: 28,
    7: 26,
    8: 24,
    9: 22,
    10: 20,
    11: 19,
    12: 18,
    13: 17,
    14: 16,
    15: 15,
    16: 14,
    17: 13,
    18: 12,
    19: 11,
    20: 10,
    21: 9,
    22: 8,
    23: 7,
    24: 6,
    25: 5,
    26: 4,
    27: 3,
    28: 2,
    29: 1,
    30: 1,
  };

  return pointsMap[position] || 0;
};
