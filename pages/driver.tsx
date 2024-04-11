import { useState, useEffect, ChangeEvent } from 'react';
import { Box, Typography, InputBase, List, ListItem } from "@mui/material";
import pool from "../utils/db";
import NavBar from '../components/NavBar'; // Import the NavBar component

// Define the type for the drivers prop
type Driver = {
  id: number;
  name: string;
  team: string;
};

type DriversProps = {
  drivers: Driver[];
};

const DriversPage = ({ drivers }: DriversProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>(drivers); // Initialize with server-side data

  useEffect(() => {
    const filtered = drivers.filter(
      driver => driver.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDrivers(filtered);
  }, [drivers, searchQuery]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  return (
    <>
      <NavBar /> {/* Include the NavBar component */}
      <Box p={4}>
        <Typography variant="h4">Drivers</Typography>
        
        {/* Search Input */}
        <InputBase 
          placeholder="Search driver or team" 
          value={searchQuery}
          onChange={handleSearch}
          style={{ marginBottom: '1rem', width: '200px' }}
        />
        
        {/* List of Drivers */}
        <List>
          {filteredDrivers.map((driver) => (
            <ListItem key={driver.id}>
              <a href={`/driver/${driver.id}`}>
                {driver.name} - {driver.team}
              </a>
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  );
};

export async function getServerSideProps() {
  const [rows] = await pool.query('SELECT * FROM driver');
  const drivers: Driver[] = rows.map((row: any) => ({
    id: row.DriverID,
    name: row.Name,
    team: row.TeamID
  }));

  return { props: { drivers } };
}

export default DriversPage;
