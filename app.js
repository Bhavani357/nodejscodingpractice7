const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
module.exports = app;

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const caseConvertion = (eachObj) => {
  return {
    matchId: eachObj.match_id,
    match: eachObj.match,
    year: eachObj.year,
  };
};

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchDetailsBasedOnPlayerId = `
    SELECT 
      match_details.match_id,
      match_details.match,
      match_details.year
    FROM
     (player_details NATURAL JOIN player_match_score )  NATURAL JOIN match_details
    WHERE 
      player_details.player_id = '${playerId}';
      `;
  const result = await db.all(getMatchDetailsBasedOnPlayerId);
  response.send(result.map((eachObj) => caseConvertion(eachObj)));
});

const caseConvertionMatch = (eachObj) => {
  return {
    playerId: eachObj.player_id,
    playerName: eachObj.player_name,
  };
};

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersBasedOnMatchId = `
    SELECT 
      player_details.player_id,
      player_details.player_name
    FROM 
      (match_details NATURAL JOIN player_match_score )  NATURAL JOIN player_details
    WHERE 
      match_details.match_id = '${matchId}';`;
  const result = await db.all(getPlayersBasedOnMatchId);
  response.send(result.map((eachObj) => caseConvertionMatch(eachObj)));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getTotalScoresOfPlayers = `
    SELECT
     player_details.player_id as playerId,
     player_details.player_name as playerName, 
     SUM(player_match_score.score) as totalScore,
     SUM(player_match_score.fours) as totalFours,
     SUM(player_match_score.sixes) as totalSixes
    FROM 
      player_match_score INNER JOIN player_details ON 
      player_details.player_id = player_match_score.player_id
    WHERE 
      player_details.player_id = ${playerId};`;
  const result = await db.get(getTotalScoresOfPlayers);
  response.send(result);
});

app.get("/players/", async (request, response) => {
  const getPlayers = `
    SELECT 
      * 
    FROM 
      player_details ;
      `;
  const players = await db.all(getPlayers);
  response.send(players.map((eachObj) => caseConvertionMatch(eachObj)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
    SELECT 
      *
    FROM 
      player_details
    WHERE 
      player_id = '${playerId}';`;
  const player = await db.get(getPlayer);
  response.send({
    playerId: player.player_id,
    playerName: player.player_name,
  });
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `
    UPDATE 
      player_details
    SET 
      player_name = '${playerName}'
    WHERE 
      player_id = '${playerId}';`;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatch = `
    SELECT 
      *
    FROM 
      match_details
    WHERE 
      match_id = '${matchId}';`;
  const result = await db.get(getMatch);
  response.send({
    matchId: result.match_id,
    match: result.match,
    year: result.year,
  });
});
