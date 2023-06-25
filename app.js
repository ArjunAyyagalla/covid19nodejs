const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const installDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => console.log("server started at 3003"));
  } catch (e) {
    prevent.event(1);
    console.log(`db:${e.message}`);
  }
};

installDBAndServer();

convertDistrictIntoPascal = (each) => {
  return {
    districtId: each.district_id,
    districtName: each.district_name,
    stateId: each.state_id,
    cases: each.cases,
    cured: each.cured,
    active: each.active,
    deaths: each.deaths,
  };
};

convertSnakeToPascal = (each) => {
  return {
    stateId: each.state_id,
    stateName: each.state_name,
    population: each.population,
  };
};

/* list of all states*/

app.get("/states/", async (request, response) => {
  const stateNames = `SELECT * FROM state`;
  const allStates = await db.all(stateNames);
  response.send(allStates.map((each) => convertSnakeToPascal(each)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getState = `
    SELECT * 
    FROM state
    WHERE state_id=${stateId};`;

  const stateDetails = await db.get(getState);
  response.send(convertSnakeToPascal(stateDetails));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrict = `
    INSERT INTO district
    (district_name,
        state_id,
        cases,
        cured,
        active,
        deaths)
    VALUES
    ('${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
        );`;

  const add = await db.run(addDistrict);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const selectDistrict = `
    SELECT *
    FROM district
    WHERE district_id=${districtId};`;

  const details = await db.all(selectDistrict);
  const resDet = convertDistrictIntoPascal(details[0]);
  response.send(resDet);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    DELETE FROM 
    district
    WHERE district_id=${districtId};`;

  await db.run(deleteDistrict);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistrict = `
  UPDATE district
  SET
  district_name='${districtName}',
  state_id=${stateId},
  cases=${cases},
  cured=${cured}, 
  active=${active},
  deaths=${deaths}

  WHERE district_id=${districtId};`;
  const update = await db.run(updateDistrict);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const totalDetails = `
    SELECT 
        SUM(cases) AS cases,
        SUM(cured) AS cured,
        SUM(active) AS active,
        SUM(deaths) AS deaths,
    FROM district
    WHERE
        state_id=${stateId}
    `;

  const det = await db.get(totalDetails);
  response.send({
    totalCases: stateDetails["sum(cases)"],
    totalCurved: stateDetails["sum(curved)"],
    totalActive: stateDetails["sum(active)"],
    totalDeaths: stateDetails["sum(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateDetails = `
    SELECT state_name
    FROM state 
    JOIN district ON
    state.state_id=district.state_id
    WHERE district.district_id=${districtId};`;
  const stateName = await db.get(stateDetails);
  response.send({ stateName: stateName.state_name });
});
module.exports = app;
