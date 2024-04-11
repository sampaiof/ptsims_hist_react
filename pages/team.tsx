import { useState, useEffect, ChangeEvent } from 'react';
import { Box, Typography, InputBase, List, ListItem } from "@mui/material";
import pool from "../utils/db";
import NavBar from '../components/NavBar'; // Import the NavBar component

// Define the type for the teams prop
type Team = {
  id: number;
  name: string;
};

type TeamsProps = {
  teams: Team[];
};

const TeamsPage = ({ teams }: TeamsProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTeams, setFilteredTeams] = useState<Team[]>(teams); // Initialize with server-side data

  useEffect(() => {
    const filtered = teams.filter(
      team => team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTeams(filtered);
  }, [teams, searchQuery]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  return (
    <>
      <NavBar /> {/* Include the NavBar component */}
      <Box p={4}>
        <Typography variant="h4">Teams</Typography>
        
        {/* Search Input */}
        <InputBase 
          placeholder="Search team" 
          value={searchQuery}
          onChange={handleSearch}
          style={{ marginBottom: '1rem', width: '200px' }}
        />
        
        {/* List of Teams */}
        <List>
          {filteredTeams.map((team) => (
            <ListItem key={team.id}>
              <a href={`/team/${team.id}`}>
                {team.name}
              </a>
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  );
};

export async function getServerSideProps() {
  const [rows] = await pool.query('SELECT * FROM team');
  const teams: Team[] = rows.map((row: any) => ({
    id: row.TeamID,
    name: row.Name
  }));

  return { props: { teams } };
}

export default TeamsPage;
