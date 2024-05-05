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
  try {
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
        r.CompetitionID as CompetitionID,
        ra.Name as name, 
        ra.Date,
        d1.Name as raceWinnerName,
        d2.Name as poleSitterName
      FROM round r
      LEFT JOIN race ra ON r.RoundID = ra.RoundID AND ra.CompetitionID = r.CompetitionID
      LEFT JOIN racedriver rdw ON ra.RaceID = rdw.RaceID AND rdw.position = 1
      LEFT JOIN racedriver rdp ON ra.RaceID = rdp.RaceID AND rdp.pole_position = 1
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
      roundMap.set(roundId, { name: row.name, Date: row.Date, raceWinnerName, poleSitterName });
    });

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

    // Fetch penalties for the competition
    const [penaltyRows] = await pool.query('SELECT * FROM Penalties WHERE CompetitionID = ?', [id]);

    // Create a map to store penalties for each driver
    const driverPenalties: Record<number, number> = {};
    
    // Process penalty rows and accumulate penalties for each driver
    penaltyRows.forEach((penalty: any) => {
      const driverID = penalty.DriverID;
      const penaltyPoints = penalty.PenaltyPoints;
      
      // Add penalty points to the driver's total penalties
      driverPenalties[driverID] = (driverPenalties[driverID] || 0) + penaltyPoints;
    });

    const driverPoints: Record<number, number> = {};
    const driverPolePositions: Record<number, number> = {}; // Initialize driver pole positions record

    for (const driver of competition.drivers) {
      const [pointsRows] = await pool.query(`
      SELECT rd.position, CAST(rd.pole_position AS UNSIGNED) AS pole_position
      FROM racedriver rd 
      JOIN race r ON rd.RaceID = r.RaceID
      JOIN round ro ON r.RoundID = ro.RoundID AND ro.CompetitionID = r.CompetitionID AND r.CompetitionID = ?
      WHERE rd.DriverID = ? ;   
      `, [id, driver.id]);

//      console.log(`Points rows for driver ${driver.id}:`, pointsRows);

      let totalPoints = 0;
      let polePositions = 0; // Initialize pole positions counter

      // Track the worst position excluding the last race
      let worstPosition = 0;
      let missedRaces = 0;
      for (let i = 0; i < pointsRows.length; i++) {
        const position = parseInt(pointsRows[i].position);
        if (i < pointsRows.length - 1 && position > worstPosition) {
          worstPosition = position;
        }
        if (parseInt(pointsRows[i].pole_position) === 1) { // Check if pole position
          polePositions++;
        }
        if(position === 8888)
        {
          missedRaces++
        }
      }

      // Flag to keep track of whether one instance of worst position has been excluded
      let worstPositionExcluded = false;

      // Calculate points excluding the worst position for all races except the last one
      for (const row of pointsRows) {
        const position = parseInt(row.position);
        const isPolePosition = parseInt(row.pole_position) === 1;

        // Check if the current race is the last one
        const isLastRace = pointsRows.indexOf(row) === pointsRows.length - 1;

        // Exclude worst position only if it's not the last race, if it's not a missed race, and if one instance hasn't been excluded yet
        if ((position !== worstPosition || isLastRace || worstPositionExcluded) && position !== 8888) {
          totalPoints += getPointsByPosition(row.position, isPolePosition);
        }

        // Update worstPositionExcluded flag if the current position matches the worst position
        if (position === worstPosition && !worstPositionExcluded) {
          worstPositionExcluded = true;
        }
      }

      // Apply penalties to driver points
      if (missedRaces < 2) {
        totalPoints += 15;
      }

      const penaltyPoints = driverPenalties[driver.id] || 0;

      driver.points = totalPoints - penaltyPoints;  // Assign the calculated points to the driver object
      driverPolePositions[driver.id] = polePositions; // Assign the calculated pole positions to the driver object
      driverPoints[driver.id] = totalPoints - penaltyPoints;
     
    }
    
    // Sort the drivers by adjusted points in descending order
    competition.drivers.sort((a, b) => b.points - a.points);

    return { props: { competition, driverPoints, driverPolePositions } };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return { props: { error: 'An error occurred' } }; // Handle error gracefully
  }
};







const getPointsByPosition = (position: number, isPolePosition: boolean): number => {
  const pointsMap = {
    1: 50,
    2: 40,
    3: 35,
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
    polePosition: 3,
  };

  // If it's a pole position, return the points for pole position
  if (isPolePosition) {
    return pointsMap[position] + pointsMap.polePosition;
  }
  else
  {
    return pointsMap[position] || 0;
  }
};

