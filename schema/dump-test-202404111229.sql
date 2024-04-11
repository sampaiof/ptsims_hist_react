-- MariaDB dump 10.19-11.3.2-MariaDB, for osx10.16 (x86_64)
--
-- Host: localhost    Database: test
-- ------------------------------------------------------
-- Server version	11.3.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `competition`
--

DROP TABLE IF EXISTS `competition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `competition` (
  `CompetitionID` int(11) NOT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Date` date DEFAULT NULL,
  `Location` varchar(255) DEFAULT NULL,
  `SimulatorID` int(11) DEFAULT NULL,
  `CompetitionTypeID` int(11) DEFAULT NULL,
  PRIMARY KEY (`CompetitionID`),
  KEY `FK_Competition_Simulator` (`SimulatorID`),
  KEY `FK_Competition_CompetitionType` (`CompetitionTypeID`),
  CONSTRAINT `FK_Competition_CompetitionType` FOREIGN KEY (`CompetitionTypeID`) REFERENCES `competitiontype` (`CompetitionTypeID`),
  CONSTRAINT `FK_Competition_Simulator` FOREIGN KEY (`SimulatorID`) REFERENCES `simulator` (`SimulatorID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `competitiondriver`
--

DROP TABLE IF EXISTS `competitiondriver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `competitiondriver` (
  `CompetitionID` int(11) NOT NULL,
  `DriverID` int(11) NOT NULL,
  PRIMARY KEY (`CompetitionID`,`DriverID`),
  KEY `DriverID` (`DriverID`),
  CONSTRAINT `competitiondriver_ibfk_1` FOREIGN KEY (`CompetitionID`) REFERENCES `competition` (`CompetitionID`),
  CONSTRAINT `competitiondriver_ibfk_2` FOREIGN KEY (`DriverID`) REFERENCES `driver` (`DriverID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `competitiontype`
--

DROP TABLE IF EXISTS `competitiontype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `competitiontype` (
  `CompetitionTypeID` int(11) NOT NULL,
  `TypeName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`CompetitionTypeID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `driver`
--

DROP TABLE IF EXISTS `driver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `driver` (
  `DriverID` int(11) NOT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `DateOfBirth` date DEFAULT NULL,
  `Nationality` varchar(255) DEFAULT NULL,
  `TeamID` int(11) DEFAULT NULL,
  `Numero` int(11) DEFAULT NULL,
  PRIMARY KEY (`DriverID`),
  KEY `TeamID` (`TeamID`),
  CONSTRAINT `driver_ibfk_1` FOREIGN KEY (`TeamID`) REFERENCES `team` (`TeamID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `race`
--

DROP TABLE IF EXISTS `race`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `race` (
  `RaceID` int(11) NOT NULL,
  `RoundID` int(11) DEFAULT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Date` date DEFAULT NULL,
  `Location` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`RaceID`),
  KEY `RoundID` (`RoundID`),
  CONSTRAINT `race_ibfk_1` FOREIGN KEY (`RoundID`) REFERENCES `round` (`RoundID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `round`
--

DROP TABLE IF EXISTS `round`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `round` (
  `RoundID` int(11) NOT NULL,
  `CompetitionID` int(11) NOT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Date` date DEFAULT NULL,
  PRIMARY KEY (`CompetitionID`,`RoundID`),
  KEY `CompetitionID` (`CompetitionID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rounddriver`
--

DROP TABLE IF EXISTS `rounddriver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rounddriver` (
  `RoundID` int(11) NOT NULL,
  `DriverID` int(11) NOT NULL,
  `position` int(11) NOT NULL,
  `pole_position` binary(1) NOT NULL,
  PRIMARY KEY (`RoundID`,`DriverID`),
  KEY `DriverID` (`DriverID`),
  CONSTRAINT `rounddriver_ibfk_1` FOREIGN KEY (`RoundID`) REFERENCES `round` (`RoundID`),
  CONSTRAINT `rounddriver_ibfk_2` FOREIGN KEY (`DriverID`) REFERENCES `driver` (`DriverID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `simulator`
--

DROP TABLE IF EXISTS `simulator`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `simulator` (
  `SimulatorID` int(11) NOT NULL,
  `Name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`SimulatorID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `team`
--

DROP TABLE IF EXISTS `team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team` (
  `TeamID` int(11) NOT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Country` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`TeamID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'test'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-04-11 12:29:48
