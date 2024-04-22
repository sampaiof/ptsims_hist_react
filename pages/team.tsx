import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { Box, Typography, TextField, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import Link from 'next/link';
import NavBar from '../components/NavBar';
import pool from "../utils/db";

type Team = {
  id: number;
  name: string;
  uniqueCompetitionsCount: number;
};

type TeamListProps = {
  teams: Team[];
};

const TeamList = ({ teams }: TeamListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <NavBar />
      <Box p={4}>
        <Typography variant="h4">Teams</Typography>

        {/* Search Bar */}
        <TextField
          label="Search by Team Name"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mt: 2 }}
        />

        {/* Teams Table */}
        {isMounted && (
          <Box mt={4}>
            <Typography variant="h5">Teams List</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Unique Competitions Count</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id} sx={{ cursor: 'pointer' }}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>{team.uniqueCompetitionsCount}</TableCell>
                    <TableCell component="div" sx={{ textDecoration: 'underline' }}>
                      <Link href={`/teams/${team.id}`} passHref>
                        <Typography variant="body2">View Details</Typography>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>
    </>
  );
};

export default TeamList;

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Fetch teams and unique competitions count for each team from the database
    const [teamRows] = await pool.query(`
      SELECT 
        t.TeamID AS id,
        t.Name,
        COUNT(DISTINCT c.CompetitionID) AS uniqueCompetitionsCount
      FROM team t
      LEFT JOIN driver d ON t.TeamID = d.TeamID
      LEFT JOIN competitiondriver cd ON d.DriverID = cd.DriverID
      LEFT JOIN competition c ON cd.CompetitionID = c.CompetitionID
      GROUP BY t.TeamID;
    `);

    const teams: Team[] = teamRows.map((row: any) => ({
      id: row.id,
      name: row.Name,
      uniqueCompetitionsCount: row.uniqueCompetitionsCount,
    }));

    // Sort teams by unique competitions count in descending order
    teams.sort((a, b) => b.uniqueCompetitionsCount - a.uniqueCompetitionsCount);

    return { props: { teams } };
  } catch (error) {
    console.error('Error fetching teams:', error);
    return {
      notFound: true, // Return 404 page if there's an error
    };
  }
};

