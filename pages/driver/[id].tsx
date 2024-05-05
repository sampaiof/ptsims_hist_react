import { GetServerSideProps } from 'next';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardContent,
  Avatar,
  Grid,
} from "@mui/material";
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

type LastRace = {
  raceName: string;
  date: string;
  position: number;
};

type Driver = {
  id: number;
  name: string;
  numero: number;
  team: string;
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

const DriverDetails = ({ driver }: DriverDetailsProps) => {
  const renderTableRows = (data: any[]) =>
    data.map((item) => (
      <TableRow key={item.id || item.raceName}>
        {Object.values(item).map((value, index) => (
          <TableCell key={index}>{value}</TableCell>
        ))}
      </TableRow>
    ));

  const renderTableCard = (title: string, data: any[], headers: string[], isStats?: boolean) => (
    <Box mt={4} key={title}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ backgroundColor: '#f44336', color: 'white', padding: '8px', borderRadius: '4px', marginBottom: '16px' }}>{title}</Typography>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e57373' }}>
                {headers.map((header) => (
                  <TableCell key={header} sx={{ color: 'white' }}>{header}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isStats ? (
                <TableRow>
                  {headers.map((header) => (
                    <TableCell key={header}>
                      {driver[header.toLowerCase() as keyof Driver] || 0}
                    </TableCell>
                  ))}
                </TableRow>
              ) : (
                renderTableRows(data as any[])
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <>
      <NavBar />
      <Box p={4}>
        <Grid container spacing={3}>
          {/* Driver Avatar */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="left" justifyContent="left" mb={4}>
              <Avatar sx={{ width: 100, height: 100, mr: 2 }}>
                {driver.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h4">{driver.name}</Typography>
                <Typography variant="subtitle1">Numero: {driver.numero}</Typography>
                <Typography variant="subtitle1">Equipa: {driver.team}</Typography>
              </Box>
            </Box>
          </Grid>

          {/* Round Counts Per Year and Additional Stats */}
          <Grid item xs={12} md={6}>
            {renderTableCard("Round Counts Per Year", driver.rounds || [], ["Year", "Round Count"])}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderTableCard("Additional Stats", [driver], ["Top 3", "Top 5", "Pole Positions", "Victories"], true)}
          </Grid>

          {/* Last 10 Races */}
          <Grid item xs={12}>
            {renderTableCard("Last 10 Races", driver.lastRaces || [], ["Race", "Date", "Position"])}
          </Grid>

          {/* Last 4 Competitions */}
          <Grid item xs={12}>
            {renderTableCard("Last 4 Competitions", driver.lastCompetitions || [], ["Competition", "Date"])}
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default DriverDetails;

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { id } = params;
  const queries = [
    {
      query: 'SELECT d.*, t.Name as TeamName FROM driver d join team t ON t.TeamID = d.TeamID where d.DriverID = ?',
      key: 'driverRows',
    },
    {
      query: `
        SELECT 
          YEAR(r.Date) AS year,
          COUNT(*) AS totalRaces
        FROM race r
        JOIN racedriver rd ON r.RaceID = rd.RaceID
        JOIN driver d ON rd.DriverID = d.DriverID
        WHERE d.DriverID = ?
        GROUP BY year;
      `,
      key: 'roundRows',
    },
    {
      query: `
        SELECT r.Name AS raceName, r.Date, rd.position
        FROM race r
        JOIN racedriver rd ON r.RaceID = rd.RaceID
        JOIN driver d ON rd.DriverID = d.DriverID
        WHERE d.DriverID = ?
        ORDER BY r.Date DESC
        LIMIT 10;
      `,
      key: 'raceRows',
    },
    {
      query: `
        SELECT c.Name AS competitionName, c.Date
        FROM competition c
        JOIN race r ON c.CompetitionID = r.CompetitionID
        JOIN racedriver rd ON r.RaceID = rd.RaceID
        JOIN driver d ON rd.DriverID = d.DriverID
        WHERE d.DriverID = ?
        GROUP BY c.CompetitionID
        ORDER BY c.Date DESC
        LIMIT 4;
      `,
      key: 'competitionRows',
    },
    {
      query: `
        SELECT 
          SUM(CASE WHEN rd.position <= 3 THEN 1 ELSE 0 END) AS top3,
          SUM(CASE WHEN rd.position <= 5 THEN 1 ELSE 0 END) AS top5,
          SUM(CASE WHEN rd.pole_position = 1 THEN 1 ELSE 0 END) AS polePositions,
          SUM(CASE WHEN rd.position = 1 THEN 1 ELSE 0 END) AS victories
        FROM racedriver rd
        WHERE rd.DriverID = ?;
      `,
      key: 'statsRows',
    },
  ];

  const queriesPromises = queries.map(({ query, key }) =>
    pool.query(query, [id]).then(([rows]) => ({ [key]: rows }))
  );

  const results = await Promise.all(queriesPromises);
  const {
    driverRows,
    roundRows,
    raceRows,
    competitionRows,
    statsRows,
  } = Object.assign({}, ...results);

  if (driverRows.length === 0) {
    return {
      notFound: true,
    };
  }

  const driver: Driver = {
    id: driverRows[0].DriverID,
    name: driverRows[0].Name,
    numero: driverRows[0].Numero,
    team: driverRows[0].TeamName,
    rounds: roundRows.map((row: any) => ({
      year: row.year,
      count: row.totalRaces,
    })),
    lastRaces: raceRows.map((row: any) => ({
      raceName: row.raceName,
      date: new Date(row.Date).toDateString(),
      position: row.position,
    })),
    lastCompetitions: competitionRows.map((row: any) => ({
      name: row.competitionName || "Unknown Competition", // Handle undefined name
      date: new Date(row.Date).toDateString(),
    })),
    top3: statsRows[0].top3,
    top5: statsRows[0].top5,
    polePositions: statsRows[0].polePositions,
    victories: statsRows[0].victories,
  };
  
  return { props: { driver } };
};




