// pages/competitions.tsx
import { useState } from 'react';
import { Box, Typography, InputBase, List, ListItem, Link } from '@mui/material';
import pool from '../utils/db';
import NavBar from '../components/NavBar';

type Competition = {
  id: number;
  name: string;
};

const Competitions = ({ competitions }: { competitions: Competition[] }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCompetitions = competitions.filter(
    competition => competition.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  return (
    <>
      <NavBar />
      <Box p={4}>
        <Typography variant="h4">Competitions</Typography>
        
        <InputBase 
          placeholder="Search competition" 
          value={searchQuery}
          onChange={handleSearch}
          style={{ marginBottom: '1rem', width: '200px' }}
        />
        
        <List>
          {filteredCompetitions.map((competition) => (
            <ListItem key={competition.id}>
              <Link href={`/competition/${competition.id}`}>
                {competition.name}
              </Link>
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  );
};

export async function getServerSideProps() {
  const [rows] = await pool.query('SELECT * FROM competition');
  
  // Check if rows exist and convert Date objects to string format
  const competitions: Competition[] = Array.isArray(rows) ? rows.map((row: any) => ({
    id: row.CompetitionID,
    name: row.Name
  })) : [];

  return { props: { competitions } };
}

export default Competitions;
