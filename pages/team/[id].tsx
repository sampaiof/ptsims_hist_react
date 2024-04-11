import { GetServerSideProps } from 'next';
import { Box, Typography, List, ListItem } from "@mui/material";
import pool from "../../utils/db";
import NavBar from '../../components/NavBar';

type Driver = {
  id: number;
  name: string;
  numero: number;
};

type Team = {
  id: number;
  name: string;
  drivers: Driver[];
};

type TeamDetailsProps = {
  team: Team;
};

const TeamDetails = ({ team }: TeamDetailsProps) => {
  return (
    <>
      <NavBar />
      <Box p={4}>
        <Typography variant="h4">{team.name}</Typography>
        
        <Box mt={4}>
          <Typography variant="h5">Drivers</Typography>
          <List>
            {team.drivers.map((driver) => (
              <ListItem key={driver.id}>
                {driver.name} - {driver.numero} - Points: {driver.points}
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    </>
  );
};

export default TeamDetails;

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { id } = params;
  
  // Fetch team details from the database based on the ID
  const [teamRows] = await pool.query('SELECT * FROM team WHERE TeamID = ?', [id]);
  
  if (teamRows.length === 0) {
    return {
      notFound: true, // Return 404 page if team not found
    };
  }
  
  // Fetch drivers associated with the team
  const [driverRows] = await pool.query(`
    SELECT d.DriverID AS id, d.Name, d.Numero
    FROM driver d 
    WHERE d.TeamID = ?
  `, [id]);
  
  const team: Team = {
    id: teamRows[0].TeamID,
    name: teamRows[0].Name,
    drivers: driverRows.map((row: any) => ({
      id: row.id,
      name: row.Name
    }))
  };
  
  return { props: { team } };
};
