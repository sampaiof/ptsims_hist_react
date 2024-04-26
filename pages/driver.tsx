import { useState, useEffect, ChangeEvent } from 'react';
import { Box, Typography, InputBase, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import pool from "../utils/db";
import NavBar from '../components/NavBar'; // Import the NavBar component

// Define the type for the drivers prop
type Driver = {
  id: number;
  name: string;
  number: number;
  team: string;
};

type DriversProps = {
  drivers: Driver[];
};

const DriversPage = ({ drivers }: DriversProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDrivers, setFilteredDrivers] = useState(drivers); // Initialize with server-side data

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
          placeholder="Search driver" 
          value={searchQuery}
          onChange={handleSearch}
          style={{ marginBottom: '1rem', width: '200px' }}
        />
        
        {/* Table of Drivers */}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Driver Name</TableCell>
              <TableCell>Driver Number</TableCell>
              <TableCell>Driver Team</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDrivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell>
                  <a href={`/driver/${driver.id}`}>
                    {driver.name}
                  </a>
                </TableCell>
                <TableCell>{driver.number}</TableCell>
                <TableCell>{driver.team}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </>
  );
};


export async function getServerSideProps() {
  const [rows] = await pool.query('SELECT d.DriverID as DriverID, d.Name as Name, d.Numero as Number, t.Name as TeamName  FROM driver d join team t ON t.TeamID = d.TeamID ');
  const drivers: Driver[] = rows.map((row: any) => ({
    id: row.DriverID,
    name: row.Name,
    number: row.Number, // Assuming this is the driver number column in your database
    team: row.TeamName // Assuming this is the driver team column in your database
  }));

  return { props: { drivers } };
}

export default DriversPage;

