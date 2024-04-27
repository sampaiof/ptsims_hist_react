import { Box, Typography } from "@mui/material";
import { GetServerSideProps } from 'next';
import pool from "../../utils/db";
import NavBar from '../../components/NavBar';

type Round = {
  id: number;
  name: string;
  date: string;
  raceWinner: string; // Add field for race winner
  poleSitter: string; // Add field for pole sitter
};

type Driver = {
  id: number;
  name: string;
  numero: number;
  points: number;
  polePositions: number; // Add polePositions field
};

type Competition = {
  id: number;
  name: string;
  rounds: Round[];
  drivers: Driver[];
};

type CompetitionProps = {
  competition: Competition;
  driverPoints: Record<number, number>;
  driverPolePositions: Record<number, number>; // Add driverPolePositions field
};

export default function CompetitionPage({ competition, driverPoints, driverPolePositions }: CompetitionProps) {
  return (
    <>
      <NavBar />
      <Box p={4}>
        <Typography variant="h4">{competition.name}</Typography>
        
        <Typography variant="h5" mt={4}>Rounds</Typography>
        <table>
          <thead>
            <tr>
              <th>Round</th>
              <th>Date</th>
              <th>Pole Sitter</th>
              <th>Race Winner</th>
            </tr>
          </thead>
          <tbody>
            {competition.rounds.map((round) => (
              <tr key={round.id}>
                <td>{round.name}</td>
                <td>{round.date}</td>
                <td>{round.poleSitter}</td>
                <td>{round.raceWinner}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Typography variant="h5" mt={4}>Drivers</Typography>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Numero</th>
              <th>Points</th>
              <th>Pole Positions</th>
            </tr>
          </thead>
          <tbody>
          {competition.drivers.map((driver) => (
              <tr key={driver.id}>
                <td>{driver.name}</td>
                <td>{driver.numero}</td>
                <td>{driverPoints[driver.id]}</td>
                <td>{driverPolePositions[driver.id]}</td>
              </tr>
          ))}
          </tbody>
        </table>
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

// Fetch rounds associated with the competition, including race winners
const [roundRows] = await pool.query(
  `
  SELECT 
  r.RoundID AS id,
  r.Name,
  r.Date,
  d1.Name as raceWinnerName,
  d2.Name as poleSitterName
  FROM round r
  LEFT JOIN rounddriver rdw ON r.RoundID = rdw.RoundID AND rdw.position = 1
  LEFT JOIN rounddriver rdp ON r.RoundID = rdp.RoundID AND rdp.pole_position = 1
  LEFT JOIN driver d1 ON d1.DriverID = rdw.DriverID
  LEFT JOIN driver d2 ON d2.DriverID = rdp.DriverID
  WHERE r.CompetitionID = ?
  `,
  [id]
);

const roundMap = new Map(); // Map to store round information

// Map race winners and pole sitters to round IDs
roundRows.forEach((row: any) => {
  const roundId = row.id;
  const raceWinnerName = row.raceWinnerName || 'N/A';
  const poleSitterName = row.poleSitterName || 'N/A';
  roundMap.set(roundId, { name: row.Name, Date: row.Date, raceWinnerName, poleSitterName });
});

console.log('Round Map:', roundMap); // Log roundMap to verify the structure

// Convert map entries to Round objects
const rounds: Round[] = Array.from(roundMap.values()).map((value: any) => ({
  id: value.id || 0,
  name: value.name,
  date: new Date(value.Date).toDateString(),
  raceWinner: value.raceWinnerName,
  poleSitter: value.poleSitterName,
}));

  

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
    rounds,
    drivers: driverRows.map((row: any) => ({
      id: row.id,
      name: row.Name,
      numero: row.Numero,
      points: 0,  // Default points to 0
      polePositions: 0, // Initialize pole positions to 0
    })),
  };

  const driverPoints: Record<number, number> = {};
  const driverPolePositions: Record<number, number> = {}; // Initialize driver pole positions record

  for (const driver of competition.drivers) {
    const [pointsRows] = await pool.query(`
      SELECT rd.position, rd.pole_position
      FROM rounddriver rd
      JOIN round r ON rd.RoundID = r.RoundID
      WHERE rd.DriverID = ? AND r.CompetitionID = ?
    `, [driver.id, id]);

    let totalPoints = 0;
    let polePositions = 0; // Initialize pole positions counter

    for (const row of pointsRows) {
      totalPoints += getPointsByPosition(row.position);
      if (parseInt(row.pole_position) === 1) { // Check if pole position
        polePositions++;
      }
    }

    driver.points = totalPoints;  // Assign the calculated points to the driver object
    driverPolePositions[driver.id] = polePositions; // Assign the calculated pole positions to the driver object
    driverPoints[driver.id] = totalPoints;
  }
  // Sort the drivers by points in descending order
  competition.drivers.sort((a, b) => b.points - a.points);

  return { props: { competition, driverPoints, driverPolePositions } };
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
