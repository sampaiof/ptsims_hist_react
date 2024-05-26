import { GetServerSideProps } from 'next';
import pool from "../../utils/db";
import NavBar from '../../components/NavBar';
import React from 'react';
import { Box, Card, CardContent, CardMedia, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';


type Round = {
  id: number;
  name: string;
  date: string;
  raceWinner: string;
  poleSitter: string;
  roundType: string;
};

type Driver = {
  id: number;
  name: string;
  numero: number;
  points: number;
  polePositions: number;
};

type Competition = {
  id: number;
  name: string;
  simulator: string;
  comp_type: string;
  rounds: Round[];
  drivers: Driver[];
};

type CompetitionProps = {
  competition: Competition;
  driverPoints: Record<number, number>;
  driverPolePositions: Record<number, number>;
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

  const points = pointsMap[position] || 0;
  if (isPolePosition) {
    return points + pointsMap.polePosition;
  }
  return points;
};

const fetchCompetitionDetails = async (competitionId: string) => {
  const [competitionRows] = await pool.query(`select c.CompetitionID, c.Name as name, c.Date, c.Location , s.Name as simulator, ct.TypeName  from competition c
	join simulator s on s.SimulatorID = c.SimulatorID 
	join competitiontype ct on ct.CompetitionTypeID = c.CompetitionTypeID 
	where c.CompetitionID =?`, [competitionId]);
  return competitionRows.length > 0 ? competitionRows[0] : null;
};

const fetchRounds = async (competitionId: string) => {
  const [roundRows] = await pool.query(`
    SELECT 
      r.RoundID AS id,
      ra.Name as name, 
      ra.Date,
      r.RoundType as roundType,
      d1.Name as raceWinnerName,
      d2.Name as poleSitterName
    FROM round r
    LEFT JOIN race ra ON r.RoundID = ra.RoundID AND ra.CompetitionID = r.CompetitionID
    LEFT JOIN racedriver rdw ON ra.RaceID = rdw.RaceID AND rdw.position = 1
    LEFT JOIN racedriver rdp ON ra.RaceID = rdp.RaceID AND rdp.pole_position = 1
    LEFT JOIN driver d1 ON d1.DriverID = rdw.DriverID
    LEFT JOIN driver d2 ON d2.DriverID = rdp.DriverID
    WHERE r.CompetitionID = ?
  `, [competitionId]);

  return roundRows;
};

const fetchDrivers = async (competitionId: string) => {
  const [driverRows] = await pool.query(`
    SELECT d.DriverID AS id, d.Name, d.Numero
    FROM driver d 
    JOIN competitiondriver cd ON d.DriverID = cd.DriverID 
    WHERE cd.CompetitionID = ?
  `, [competitionId]);

  return driverRows;
};

const fetchPenalties = async (competitionId: string) => {
  const [penaltyRows] = await pool.query('SELECT * FROM Penalties WHERE CompetitionID = ?', [competitionId]);
  return penaltyRows;
};

const fetchDriverRaceResults = async (competitionId: string, driverId: number) => {
  const [pointsRows] = await pool.query(`
    SELECT rd.position, CAST(rd.pole_position AS UNSIGNED) AS pole_position, r.RoundID
    FROM racedriver rd 
    JOIN race r ON rd.RaceID = r.RaceID
    JOIN round ro ON r.RoundID = ro.RoundID AND ro.CompetitionID = r.CompetitionID AND r.CompetitionID = ?
    WHERE rd.DriverID = ?
  `, [competitionId, driverId]);

  return pointsRows;
};

const calculatePoints = (pointsRows: any[], driverPenalties: Record<number, number>, driverId: number, lastRoundId: number): { totalPoints: number, polePositions: number } => {
  let totalPoints = 0;
  let polePositions = 0;
  let missedRounds = 0;

  const rounds: Record<number, { totalPoints: number, races: any[], isSuspended: boolean, hasDisqualification: boolean, missedRaceCount: number }> = {};

  pointsRows.forEach(row => {
    const { position, pole_position, RoundID } = row;
    const pos = parseInt(position);
    const isPole = parseInt(pole_position) === 1;

    if (!rounds[RoundID]) {
      rounds[RoundID] = { totalPoints: 0, races: [], isSuspended: false, hasDisqualification: false, missedRaceCount: 0 };
    }

    if (pos === 2222) {
      rounds[RoundID].isSuspended = true;
    }

    if (pos === 6666) {
      rounds[RoundID].hasDisqualification = true;
    }

    const racePoints = (pos === 2222 || pos === 6666) ? 0 : getPointsByPosition(pos, isPole);
    rounds[RoundID].totalPoints += racePoints;
    rounds[RoundID].races.push({ position: pos, points: racePoints, isPole });

    if (pos === 8888 || pos === 2222) {
      rounds[RoundID].missedRaceCount++;
    }

    if (isPole) {
      polePositions++;
    }
  });

  let worstRoundId = null;
  let worstRoundPoints = Infinity;

  Object.keys(rounds).forEach(roundId => {
    const round = rounds[roundId];
    if (parseInt(roundId) !== lastRoundId && !round.isSuspended && !round.hasDisqualification && round.totalPoints < worstRoundPoints) {
      worstRoundPoints = round.totalPoints;
      worstRoundId = roundId;
    }
  });

  Object.keys(rounds).forEach(roundId => {
    if (roundId !== worstRoundId && !rounds[roundId].isSuspended) {
      const round = rounds[roundId];
      round.races.forEach(race => {
        totalPoints += race.points;
      });
    }
  });

  Object.keys(rounds).forEach(roundId => {
    const round = rounds[roundId];
    if (round.missedRaceCount === round.races.length) {
      missedRounds++;
    }
  });

  if (missedRounds < 2) {
    totalPoints += 15;
  }

  const penaltyPoints = driverPenalties[driverId] || 0;
  totalPoints -= penaltyPoints;

  return { totalPoints, polePositions };
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const { id } = params;
    const competitionId = id as string;

    const competition = await fetchCompetitionDetails(competitionId);
    console.log("competição",competition);
    if (!competition) {
      return { notFound: true };
    }

    const roundRows = await fetchRounds(competitionId);
    const driverRows = await fetchDrivers(competitionId);
    const penaltyRows = await fetchPenalties(competitionId);

    const driverPenalties: Record<number, number> = {};
    penaltyRows.forEach((penalty: any) => {
      const driverID = penalty.DriverID;
      const penaltyPoints = penalty.PenaltyPoints;
      driverPenalties[driverID] = (driverPenalties[driverID] || 0) + penaltyPoints;
    });

    const driverPoints: Record<number, number> = {};
    const driverPolePositions: Record<number, number> = {};

    const lastRoundId = roundRows[roundRows.length - 1].id;

    for (const driver of driverRows) {
      const pointsRows = await fetchDriverRaceResults(competitionId, driver.id);
      const { totalPoints, polePositions } = calculatePoints(pointsRows, driverPenalties, driver.id, lastRoundId);

      driverPoints[driver.id] = totalPoints;
      driverPolePositions[driver.id] = polePositions;
    }

    const rounds: Round[] = roundRows.map((row: any) => ({
      id: row.id,
      name: row.name,
      date: new Date(row.Date).toDateString(),
      raceWinner: row.raceWinnerName || 'N/A',
      poleSitter: row.poleSitterName || 'N/A',
      roundType: row.roundType
    }));

    const competitionData: Competition = {
      id: competition.CompetitionID,
      name: competition.name,
      simulator: competition.simulator,
      comp_type: competition.TypeName,
      rounds,
      drivers: driverRows.map((row: any) => ({
        id: row.id,
        name: row.Name,
        numero: row.Numero,
        points: driverPoints[row.id],
        polePositions: driverPolePositions[row.id],
      })).sort((a, b) => b.points - a.points),
    };

    return { props: { competition: competitionData, driverPoints, driverPolePositions } };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return { props: { error: 'An error occurred' } };
  }
};

export default function CompetitionPage({ competition, driverPoints, driverPolePositions }) {
  if (!competition) {
    return (
      <>
        <NavBar />
        <Box p={4}>
          <Typography variant="h4">Competition Not Found</Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Box p={4}>
      <Card sx={{ display: 'flex', mb: 4 }}>
          {competition.simulator.logoPath && (
            <CardMedia
              component="img"
              sx={{ width: 151 }}
              image={competition.simulator.logoPath}
              alt={`${competition.simulator.name} logo`}
            />
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardContent>
              <Typography component="div" variant="h5">{competition.name}</Typography>
              <Typography variant="subtitle1" color="text.secondary" component="div">
                Simulator: {competition.simulator.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" component="div">
                Type: {competition.type}
              </Typography>
            </CardContent>
          </Box>
        </Card>

        <Typography variant="h5" mt={4}>Rounds</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Round</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Pole Sitter</TableCell>
                <TableCell>Race 1 Winner</TableCell>
                <TableCell>Race 2 Winner</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {competition.rounds.map((round) => (
                <TableRow key={round.id}>
                  <TableCell>{round.name || 'N/A'}</TableCell>
                  <TableCell>{round.date || 'N/A'}</TableCell>
                  <TableCell>{round.poleSitter || 'N/A'}</TableCell>
                  <TableCell>{round.race1Winner || 'N/A'}</TableCell>
                  <TableCell>{round.race2Winner || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h5" mt={4}>Drivers</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Number</TableCell>
                <TableCell>Points</TableCell>
                <TableCell>Pole Positions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {competition.drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>{driver.name || 'N/A'}</TableCell>
                  <TableCell>{driver.numero || 'N/A'}</TableCell>
                  <TableCell>{driverPoints[driver.id] !== undefined ? driverPoints[driver.id] : 'N/A'}</TableCell>
                  <TableCell>{driverPolePositions[driver.id] !== undefined ? driverPolePositions[driver.id] : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}
