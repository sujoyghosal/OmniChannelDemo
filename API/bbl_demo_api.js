// Loads the configuration from config.env to process.env
const express = require("express");
const mongodb = require("mongodb");
const execSh = require("exec-sh");
const xl = require('excel4node');
var http = require("http");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8080;
var eventDocument = null;
const app = express();
var loggedinUsersWithActiveJourneys = [];
var rooms = [];
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var last_scan_id = 0;
/*
const options = {
  key: fs.readFileSync("server.key"),
  cert: fs.readFileSync("server.cert"),
};*/

app.use(function (err, _req, res, next) {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

let dbConnection;

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://sujoy:EjVe9knedEVhohNJ@cluster0.bk6hekg.mongodb.net/?retryWrites=true&w=majority";
//  "mongodb://mongo-5.concession-kiosk.svc.cluster.local";
//"mongodb://admin:admin@mongo-sujoy-concession-kiosk.pcf-to-ocp-migration-c6c44da74def18a795b07cc32856e138-0000.us-south.containers.appdomain.cloud"
console.log("MongoDB URL=" + uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: false,
  serverApi: ServerApiVersion.v1,
});
client.connect((err) => {
  dbConnection = client.db("BBL_Demo_DB");
  //dbConnection = client.db("rhelopenshifttest");
  // perform actions on the collection object
  console.log("Successfully connected to MongoDB - PCFToOpenshiftDB.." + uri);
  //client.close();
});

app.get("/", (req, res) => {
  res.send("Hi, Welcome to the PCF to OpenShift APIs")
});
app.get("/users", (req, res) => {
  console.log("Fetching user for email " + req.query.email);
  dbConnection
    .collection("Users")
    .find({
      email: {
        $eq: req.query.email,
      },
    })
    .limit(50)
    .toArray(function (err, result) {
      if (err) {
        res.status(400).send("Error fetching users!" + err);
      } else {
        res.json(result);
      }
    });
});
app.get("/login", (req, res) => {
  dbConnection
    .collection("Users")
    .find({
      email: {
        $eq: req.query.email,
      },
    })
    .limit(1)
    .toArray(function (err, result) {
      if (err) {
        res.status(400).send("Error fetching user - " + err);
        console.log("Failed login for " + req.query.email + ": " + err);
      } else {
        //res.json(result);
        console.log("Login response: " + JSON.stringify(result));
        if (
          result &&
          result.length > 0 &&
          checkPassword(req.query.password, result[0].pw)
        ) {
          res.status(200).jsonp(result[0]);
          console.log("Success login for " + req.query.email);
          //check if the user had any active journeys on any other channels
          var newUser = result[0];
          var found = false;
          for(i=0; i<loggedinUsersWithActiveJourneys.length; i++){
            if(loggedinUsersWithActiveJourneys[i].email == newUser.email){
              found = true;
              break;
            }
          }
          if(found){
            //broadcast event to all loggedin users
            //io.emit("new-login-with-active-journey", {
            io.in(newUser.email).emit("new-login-with-active-journey", {  
            user: result[0],
          });
          }
          
        } else {
          res.status(400).send([]);
          console.log("Failed login for " + req.query.email);
        }
      }
    });
});
app.get("/activeJourney", (req, res) => {
  dbConnection
    .collection("Events")
    .find()
    .sort({ "time_created": -1 })
    .limit(1)
    .toArray(function (err, result) {
      if (err) {
        res.status(400).send("Error fetching user - " + err);
        console.log("Failed login for " + req.query.email + ": " + err);
      } else {
        //res.json(result);
        console.log("GetLastScanID Response: " + JSON.stringify(result));
        //last_scan_id = result[0].scan_id;
        res.status(200).send(JSON.stringify(result));
      }
    });
});
app.get("/getlastscandetails", (req, res) => {
  if (req.query.scan_id) {
    console.log("Scan ID = " + req.query.scan_id);
  } else {
    console.log("No scan id");
    res.status(400).send("Missing Scan ID.");
    return;
  }
  dbConnection
    .collection("Events")
    .find({
      scan_id: req.query.scan_id
    })
    .limit(2000)
    .toArray(function (err, result) {
      if (err) {
        res.status(400).send("Error fetching user - " + err);
        console.log("Failed login for " + req.query.email + ": " + err);
      } else {
        console.log(result);
        res.jsonp(result);
      }
    });
});
function generateQueryFilteredExcel(jsonfile, req, res, desc) {
  const wb = new xl.Workbook();
  const ws = wb.addWorksheet(desc);
  var headerStyle = wb.createStyle({
    font: {
      bold: true,
      color: '000000',
      size: 14,
    },
  });
  var style = wb.createStyle({
    font: {
      color: '#000000',
      size: 12,
      name: 'Calibri',
    }
  });
  var json = []
  fs.readFile(jsonfile, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    json = JSON.parse(data);
    //console.log("Success reading data, length=" + json.length);
    var arr = []
    for (i = 0; i < json.length; i++) {
      //console.log(JSON.stringify(json[i]));
      var obj = {
        "Scan_ID": json[i].scan_id,
        "Time": JSON.stringify(json[i].time_created).replace(/"/g, ""),
        "Type": JSON.stringify(json[i].file_type).replace(/"/g, ""),
        "File": JSON.stringify(json[i].file_details.file).replace(/"/g, ""),
        "Dependencies": JSON.stringify(json[i].file_details.dependencies).replace(/"/g, ""),
        "User_Defined_Env_Vars": JSON.stringify(json[i].file_details.env_vars[0]),
        "VCAP_Env_Vars": JSON.stringify(json[i].file_details.vcap_env_vars),
        "App_Name": JSON.stringify(json[i].manifest.applications[0].name).replace(/"/g, ""),
        "Memory": JSON.stringify(json[i].manifest.applications[0].memory).replace(/"/g, ""),
        "Instances": json[i].manifest.applications[0].instances,
        "Disk_Quota": JSON.stringify(json[i].manifest.applications[0].disk_quota).replace(/"/g, ""),
        "Buildpacks": JSON.stringify(json[i].manifest.applications[0].buildpacks).replace(/"/g, ""),
        "Log_Rate_Limit": JSON.stringify(json[i].manifest.applications[0]['log-rate-limit']).replace(/"/g, ""),
        "App_Env_Vars": JSON.stringify(json[i].manifest.applications[0].env),
        "Routes": JSON.stringify(json[i].manifest.applications[0].routes)
      }
      arr.push(obj);
    }
    console.log("Array Length = " + arr.length);
    const headingColumnNames = [
      "Scan ID",
      "Date",
      "Type",
      "File Name",
      "Dependencies",
      "User Defined Env Vars",
      "System (VCAP) Env Vars",
      "App Name",
      "Memory",
      "Instances",
      "Disk Quota",
      "Buildpacks",
      "Log Rate Limit",
      "Application Env Variables",
      "Routes"
    ];
    //Write Column Title in Excel file
    let headingColumnIndex = 1;
    headingColumnNames.forEach(heading => {
      ws.cell(1, headingColumnIndex++)
        .string(heading).style(headerStyle)
    });
    //Write Data in Excel file
    let rowIndex = 2;
    arr.forEach(record => {
      let columnIndex = 1;
      Object.keys(record).forEach(columnName => {
        if (columnIndex == 1 || columnIndex == 10) {
          ws.cell(rowIndex, columnIndex++)
            .number(record[columnName]).style(style)
        } else {
          ws.cell(rowIndex, columnIndex++)
            .string(record[columnName]).style(style)
        }
      });
      rowIndex++;
    });
    console.log("Sending data.xls to web client..")
    //wb.write('/tmp/data.xls');
    wb.write('/tmp/data.xls', res);

    //res.setHeader("Content-Disposition", "attachment; filename=" + '/Users/Sujoy.Ghosal/apps/PCFToOS-API2/data.xlsx');
  });
  //res.setHeader("Content-Type", "application/vnd.ms-excel");
  /*res.writeHead(200, {
    'Content-Type': 'application/vnd.ms-excel',
    'Content-Length': fs.statSync('data.xls').size
  });
  var readStream = fs.createReadStream('data.xls');
  // We replaced all the event handlers with a simple call to readStream.pipe()
  readStream.pipe(res);*/
}
async function getUserByEmail(email) {
  if (!email || email == null || email.length < 3) {
    console.log("GetUserByEmail: Not a valid email");
    return;
  }
  dbConnection
    .collection("User")
    .find({
      email: {
        $eq: email,
      },
    })
    .limit(1)
    .toArray(function (err, result) {
      if (err) {
        console.log("Error fetching user!" + err);
        return null;
      } else {
        //res.json(result);
        if (result && result.length > 0) {
          console.log("Email already exists " + result[0]);
          return true;
        } else return false;
      }
    });
}
var bcrypt = require("bcrypt");
const { response } = require("express");
const { stringify } = require("querystring");
var encryptedPw = "null";

function encryptPassword(password) {
  const saltRounds = 10;
  const myPlaintextPassword = password;
  var salt = bcrypt.genSaltSync(saltRounds);
  var hash = bcrypt.hashSync(myPlaintextPassword, salt);
  encryptedPw = hash;
  console.log("Encrypted password=" + hash);
  return hash;
}

function checkPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
  //return true;
}

// This section will help you create a new record.
app.post("/users/insert", (req, res) => {
  var email = req.body.email;
  if (!email || email == null || email.length < 3) {
    console.log("Not a valid email");
    return;
  }
  console.log(JSON.stringify(req.body));
  dbConnection
    .collection("Users")
    .find({
      email: {
        $eq: email,
      },
    })
    .limit(1)
    .toArray(function (err, result) {
      if (err) {
        console.log("Error fetching user!" + err);
        return null;
      } else {
        //res.json(result);
        if (result && result.length > 0) {
          console.log("Email already exists " + JSON.stringify(result[0]));
          res.status(400).send("Email Exists");
          return;
        } else {
          encryptedPw = encryptPassword(req.body.password);
          const userDocument = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            //address: req.body.address,
            pw: encryptedPw,
            ngo: req.body.ngo ? req.body.ngo : false,
            create_time: new Date(),
          };

          dbConnection
            .collection("Users")
            .insertOne(userDocument, function (err, result) {
              if (err) {
                console.error(JSON.stringify(err));
                res.status(400).send("Error inserting user data!");
              } else {
                console.log(`Added a new user with id ${result.insertedId}`);
                res.status(201).send("Success");
              }
            });
        }
      }
    });
});
app.post("/createpayee", (req, res) => {
  console.log("Creating new payee for " + req.body.email);
  const payeeDocument = req.body.payee;
  var email = req.body.email;

  dbConnection
    .collection("Users")
    .insertOne(transactionDocument, function (err, result) {
      if (err) {
        console.error(JSON.stringify(err));
        res.status(400).send("Error inserting transaction data!");
      } else {
        console.log(`Added a new transaction with id ${result.insertedId}`);
        console.log("Sending New Transaction Event to App via WebSocket channel");
        io.local.emit("new-transaction", {
          event_id: `${result.insertedId}`,
          eventDetails: transactionDocument,
        });
        res.status(201).send("Success");
      }
    });
});
app.post("/transaction", (req, res) => {

  const transactionDocument = {
    user_name: req.body.user_name,
    user_email: req.body.user_email,
    user_phone: req.body.user_phone,
    merchant_name: req.body.merchant_name,
    merchant_email: req.body.merchant_email,
    merchant_phone: req.body.merchant_phone,
    merchant_address: req.body.merchant_address,
    transaction_amount: req.body.transaction_amount,
    transaction_currency: req.body.transaction_currency,
    create_time: new Date(),
  };

  dbConnection
    .collection("Transactions")
    .insertOne(transactionDocument, function (err, result) {
      if (err) {
        console.error(JSON.stringify(err));
        res.status(400).send("Error inserting transaction data!");
      } else {
        console.log(`Added a new transaction with id ${result.insertedId}`);
        console.log("Sending New Transaction Event to App via WebSocket channel");
        io.local.emit("new-transaction", {
          event_id: `${result.insertedId}`,
          eventDetails: transactionDocument,
        });
        res.status(201).send("Success");
      }
    });
});
app.get("/transactions", (req, res) => {
  console.log("Fetching transactions for email " + req.query.email);
  dbConnection
    .collection("Transactions")
    .find({
      user_email: {
        $eq: req.query.email,
      },
    })
    .limit(50)
    .toArray(function (err, result) {
      if (err) {
        res.status(400).send("Error fetching users!" + err);
      } else {
        res.json(result);
      }
    });
});

function GetRecentTransactions(email) {
  console.log("Fetching transactions for email " + email);
  dbConnection
    .collection("Transactions")
    .find({
      user_email: {
        $eq: email,
      },
    })
    .limit(50)
    .toArray(function (err, result) {
      if (err) {
        console.log("Error fetching users!" + err);
        io.local.emit("recent-transactions", {

        });
      } else {
        console.log("Sending recent transactions to web client via WebSocket channel id: " + mysocket);
        io.local.emit("recent-transactions", result);
      }
    });
  }


// This section will help you delete a record
app.delete("/users/delete", (req, res) => {
  console.log("Received delete request for cust id " + req.body.userID);
  const custQuery = {
    userID: req.body.userID,
  };

  dbConnection.collection("User").deleteOne(custQuery, function (err, _result) {
    if (err) {
      res.status(400).send(`Error deleting user with id ${custQuery.userID}!`);
    } else {
      console.log("1 document deleted");
      res.status(200).send();
    }
  });
});

//getEvents by scan id
app.get("/eventsbyscanid", (req, res) => {
  var scan_id = Number(req.query.scan_id);
  dbConnection
    .collection("Events")
    .find({
      "scan_id": scan_id,
    })
    .limit(1000)
    .toArray(function (err, result) {
      if (err) {
        console.log(
          "eventsbyemailandtype - Failed to fetch events " + err
        );
        res.status(400).send("Error fetching Events!" + err);
      } else {
        //res.json(result);
        if (result && result.length > 0) {
          res.status(200).jsonp(result);
          console.log(
            "eventsbyemailandtype - Success fetching events for " +
            req.query.scan_id
          );
        } else {
          res.status(200).send([]);
          console.log("No Events for " + scan_id);
        }
      }
    });
});
app.post("/new-scan-started", (req, res) => {
  console.log("Got new scan started event from discovery script...");
  console.log("Notifying to all connected browsers");
  //io.sockets.in(channel).emit("new-scan", {

  io.local.emit("new-event", {
    message: "Streaming Scan data to follow..."
  });
  res.send("Success Notifying New Scan Event to clients!")
});
//Create Event
app.post("/events/insert", (req, res) => {
  console.log("Stroing scan details for project  " + req.body.current_project);
  last_scan_id = req.body.scan_id;
  eventDocument = {
    scan_id: req.body.scan_id,
    time_created: req.body.timestamp,
    event_type: "top level scan",
    project_name: req.body.current_project,
    file_type: req.body.type,
    total_files: req.body.total_files,
    file_number: req.body.file_number,
    milestones: [
      {
        milestone_name: "Discovery Scan",
        milestone_status: "Done",
        milestone_notes: "All good",
      },
      {
        milestone_name: "Remediation",
        milestone_status: "Pending",
        milestone_notes: "",
      },
      {
        milestone_name: "Transformation",
        milestone_status: "Pending",
        milestone_notes: "",
      },
      {
        milestone_name: "Target Artefact Push",
        milestone_status: "Pending",
        milestone_notes: "",
      },
      {
        milestone_name: "Deployment Test",
        milestone_status: "Pending",
        milestone_notes: "",
      }
    ],
    file_details: req.body.file_details,
    manifest: req.body.manifest,
    packagejson: req.body.packagejson
  };
  createEvent(eventDocument, req, res);
});

//Create Event
//app.post("/events/insert", (req, res) => {
function createEvent(obj, req, res) {
  //console.log("Event document = " + JSON.stringify(obj));
  //console.log("Sending event to all connected browsers..event id=" + obj.scan_id);
  //io.sockets.in(channel).emit("new-scan", {

  io.local.emit("new-scan", {
    event_id: obj.scan_id,
    eventDetails: obj,
  });
  dbConnection.collection("Events").insertOne(obj, function (err, result) {
    if (err) {
      console.error(JSON.stringify(err));
      res.status(401).send(err);
    } else {
      console.log(`Added a new scan event to DB with id ${result.insertedId}`);
      res.status(200).send("Success");
    }
  });
  //dbConnection.collection("Events").createIndex({ location: "2dsphere" });
  /*const eventsCollection = dbConnection.collection("Events");
  const result = eventsCollection.createIndex({ location: "2dsphere" });*/
  //console.log(`Index created: ${result}`);
}
function storeJourneyData(obj) {
  //console.log("Event document = " + JSON.stringify(obj));
  //console.log("Sending event to all connected browsers..event id=" + obj.scan_id);
  //io.sockets.in(channel).emit("new-scan", {

  /*dbConnection.collection("ActiveJourneys").insertOne(obj, function (err, result) {
    if (err) {
      console.error(JSON.stringify(err));
    } else {
      console.log(`Added journey data from user input to DB with id ${result.insertedId}`);
    }
  });*/
  dbConnection.collection("ActiveJourneys").update(
    { email: obj.email },  // Query parameter
    { $set: obj
    },
    { upsert: true }  // Options
 )
  loggedinUsersWithActiveJourneys.push(obj);
  //dbConnection.collection("Events").createIndex({ location: "2dsphere" });
  /*const eventsCollection = dbConnection.collection("Events");
  const result = eventsCollection.createIndex({ location: "2dsphere" });*/
  //console.log(`Index created: ${result}`);
}
function getJourneyData(email) {
  console.log("Fetching journey data for email " + email);
  dbConnection
  .collection("ActiveJourneys")
  .find({
    email: email
  })
  .limit(2000)
  .toArray(function (err, result) {
    if (err) {
      console.log("Failed login for " + req.query.email + ": " + err);
    } else {
      console.log("Success Calling getJourneyData");
      if (result && result.length > 0) {
        io.in(email).emit("new-login-with-active-journey", {  
          user: result,
        });
      } else {
        console.log("No events");
      }
    }
  }); 
}
app.post("/journeydata", (req, res) => {
  console.log("Storing journey details for user  " + req.body.email);
  var journeyDocument = req.body;
  console.log("Journey document = " + JSON.stringify(journeyDocument));
  storeJourneyData(journeyDocument);
  res.send("Success");
});
//Get Events By Subscription

app.get("/fetchevents", (req, res) => {
  console.log("FetchEvents Call...");

  dbConnection
    .collection("Events")
    .find({
      file_type: {
        //$in: req.body.scan_id,
        //$in: [29233],
        $eq: "javascript",
      },
    })
    .limit(200)
    .toArray(function (err, result) {
      if (err) {
        console.log("Failed to fetch event  " + err);
        res.status(404).send("No events");
      } else {
        //res.json(result);
        console.log("Success Calling fetch events");
        if (result && result.length > 0) {
          res.status(200).jsonp(result);
        } else {
          res.status(404).send("No Events");
          console.log("No events");
        }
      }
    });
});
app.get("/topscan", (req, res) => {
  console.log("topscan Call for scan id = " + req.query.scan_id);
  var type = req.query.type;
  if (!type || type == undefined)
    type = "json";
  dbConnection
    .collection("Events")
    .find({
      scan_id: Number.parseInt(req.query.scan_id)
    })
    .limit(20000)
    .toArray(function (err, result) {
      if (err) {
        console.log("Failed topscan  " + err);
        res.status(404).send("No events");
      } else {
        console.log("Success Calling topscan events");
        if (type == "json") {
          var count_dep = 0;
          var count_env_vars = 0;
          var count_vcap = 0;
          for (i = 0; i < result.length; i++) {
            count_dep +=
              Number.parseInt(result[i].file_details.count_of_dependencies);
            count_env_vars +=
              Number.parseInt(result[i].file_details.env_vars_count);
            count_vcap +=
              Number.parseInt(result[i].file_details.vcap_env_vars_count);
          }
          console.log("Count of dependencies=" + count_dep + ", env_vars=" + count_env_vars + ", vcap=" + count_vcap);
          var data = {
            total_count_of_dependencies: count_dep,
            total_count_env_vars: count_env_vars,
            total_count_vcap: count_vcap,
            data: result
          }
          res.jsonp(data);
          return;
        }
        console.log("creating excel for topscan....");
        if (result && result.length > 0) {
          var options = { flag: 'w' };
          fs.writeFile('/tmp/topscan_results.json', JSON.stringify(result), options, err => {
            if (err) {
              console.error(err);
            }
            console.log("Created file...");
            generateQueryFilteredExcel('/tmp/topscan_results.json', req, res, "Top Level Scan Data");
          });
          //res.status(200).jsonp(result);
        } else {
          res.status(404).send("No Events");
          console.log("No events");
        }
      }
    });
});

app.get("/getProjectStatus", (req, res) => {
  console.log("getProjectStatus Call for project = " + req.query.project_name);
  var type = req.query.type;
  if (!type || type == undefined)
    type = "json";
  dbConnection
    .collection("Events")
    .find({
      project_name: req.query.project_name
    })
    .sort({ "time_created": -1 })
    .limit(1)
    .toArray(function (err, result) {
      if (err) {
        console.log("Failed topscan  " + err);
        res.status(404).send("No events");
      } else {
        console.log("Success Calling getProjectStatus events: " + JSON.stringify(result));
        res.jsonp(result);
        return;
      }
    });
});
app.get("/getEventsForInstances", (req, res) => {
  console.log("getEventsForInstances Call for scan id = " + req.query.scan_id);
  var type = req.query.type;
  if (!type || type.length == 0) {
    console.log("No type value found in request - setting to default very high");
    type = "vh";
  }
  var response = req.query.response;
  if (!response)
    response = "excel";
  var threshold_low = 0;
  var threshold_high = 0;
  var desc = "";
  switch (type) {
    case "n":
      threshold_low = 0;
      threshold_high = 2;
      desc = "Normal Container Instances";
      break;
    case "mh":
      threshold_low = 2;
      threshold_high = 4;
      desc = "Medium High Container Instances";
      break;
    case "h":
      threshold_low = 4;
      threshold_high = 6;
      desc = "High Container Instances";
      break;
    case "vh":
      threshold_low = 6;
      threshold_high = 4000;
      desc = "Very High Container Instances";
      break;
  }
  dbConnection
    .collection("Events")
    .find({
      scan_id: Number.parseInt(req.query.scan_id),
      'manifest.applications.0.instances': { $gt: threshold_low, $lte: threshold_high }
    })
    .limit(20000)
    .toArray(function (err, result) {
      if (err) {
        console.log("Failed getEventsForInstances  " + err);
        res.status(404).send("No events");
      } else {
        //res.json(result);
        console.log("Success Calling fetch events");
        if (result && result.length > 0) {
          if (response.toLowerCase() == "json") {
            console.log("Sending JSON back to caller....");
            res.jsonp(result);
            return;
          }
          var options = { flag: 'w' };
          fs.writeFile('/tmp/instances.json', JSON.stringify(result), options, err => {
            if (err) {
              console.error(err);
            }
            console.log("Created file...");
            generateQueryFilteredExcel('/tmp/instances.json', req, res, desc);
          });
          //res.status(200).jsonp(result);
        } else {
          //res.status(404).send("No Events");
          console.log("No events");
        }
      }
    });
});

app.get("/getEventsForMemory", (req, res) => {
  console.log("getEventsForMemory Call for scan id = " + req.query.scan_id);
  var type = req.query.type;
  if (!type || type.length == 0) {
    console.log("No type value found in request - setting to default very high");
    type = "vh";
  }
  var response = req.query.response;
  if (!response)
    response = "excel";
  var threshold_low = 0;
  var threshold_high = 0;
  var desc = "";
  switch (type) {
    case "n":
      threshold_low = 0;
      threshold_high = 256;
      desc = "Normal Container Memory"
      break;
    case "mh":
      threshold_low = 256;
      threshold_high = 512;
      desc = "Medium High Container Memory"
      break;
    case "h":
      threshold_low = 512;
      threshold_high = 1024;
      desc = "High Container Memory"
      break;
    case "vh":
      threshold_low = 1024;
      threshold_high = 5000;
      desc = "Very High Container Memory"
      break;
  }
  dbConnection
    .collection("Events")
    .find({
      scan_id: Number.parseInt(req.query.scan_id),
      //'manifest.applications.0.memory': { $gt: 1024 }
    })
    .limit(5000)
    .toArray(function (err, result) {
      if (err) {
        console.log("Failed getEventsForMemory  " + err);
        res.status(404).send("No events");
      } else {
        //res.json(result);
        console.log("Success Calling fetch events");
        if (result && result.length > 0) {
          var m_array = [];
          for (i = 0; i < result.length; i++) {
            var m = result[i].manifest.applications[0].memory.replace(/\D/g, '');
            if (m > threshold_low && m <= threshold_high) {
              m_array.push(result[i]);
            }
          }
          console.log("Found " + m_array.length + " projects with " + type + " type memory values in manifest.yaml.");
          if (response.toLowerCase() == "json") {
            console.log("Sending JSON back to caller....");
            res.jsonp(m_array);
            return;
          }
          var options = { flag: 'w' };
          fs.writeFile('/tmp/memory.json', JSON.stringify(m_array), options, err => {
            if (err) {
              console.error(err);
            }
            console.log("Created file...");
            generateQueryFilteredExcel('/tmp/memory.json', req, res, desc);
          });
          //res.status(200).jsonp(result);
        } else {
          res.status(404).send("No Events");
          console.log("No events");
        }
      }
    });
});

app.get("/getEventsForDiskQuota", (req, res) => {
  console.log("getEventsForDiskQuota Call for scan id = " + req.query.scan_id);
  var type = req.query.type;
  if (!type || type.length == 0) {
    console.log("No type value found in request - setting to default very high");
    type = "vh";
  }
  var response = req.query.response;
  if (!response)
    response = "excel";
  var threshold_low = 0;
  var threshold_high = 0;
  var desc = "";
  switch (type) {
    case "n":
      threshold_low = 0;
      threshold_high = 2000;
      desc = "Normal Container Memory"
      break;
    case "mh":
      threshold_low = 2000;
      threshold_high = 4000;
      desc = "Medium High Container Memory"
      break;
    case "h":
      threshold_low = 4000;
      threshold_high = 6000;
      desc = "High Container Memory"
      break;
    case "vh":
      threshold_low = 6000;
      threshold_high = 20000;
      desc = "Very High Container Memory"
      break;
  }
  dbConnection
    .collection("Events")
    .find({
      scan_id: Number.parseInt(req.query.scan_id),
      //'manifest.applications.0.memory': { $gt: 1024 }
    })
    .limit(5000)
    .toArray(function (err, result) {
      if (err) {
        console.log("Failed getEventsForMemory  " + err);
        res.status(404).send("No events");
      } else {
        //res.json(result);
        console.log("Success Calling fetch events");
        if (result && result.length > 0) {
          var m_array = [];
          for (i = 0; i < result.length; i++) {
            var m = result[i].manifest.applications[0].disk_quota.replace(/\D/g, '');
            if (m > threshold_low && m <= threshold_high) {
              m_array.push(result[i]);
            }
          }
          console.log("Found " + m_array.length + " projects with " + type + " type disk_quota values in manifest.yaml.");
          if (response.toLowerCase() == "json") {
            console.log("Sending JSON back to caller....");
            res.jsonp(m_array);
            return;
          }
          var options = { flag: 'w' };
          fs.writeFile('/tmp/memory.json', JSON.stringify(m_array), options, err => {
            if (err) {
              console.error(err);
            }
            console.log("Created file...");
            generateQueryFilteredExcel('/tmp/memory.json', req, res, desc);
          });
          //res.status(200).jsonp(result);
        } else {
          res.status(404).send("No Events");
          console.log("No events");
        }
      }
    });
});

app.get("/getEventsByFileType", (req, res) => {
  console.log("getEventsByFileType Call for scan id = " + req.query.scan_id);
  var file_type = req.query.file_type;
  var options = {}
  if (!file_type || file_type.length == 0) {
    console.log("No file_type value found in request - returning all");
    options = {
      scan_id: Number.parseInt(req.query.scan_id)
    }
  } else {
    options = {
      scan_id: Number.parseInt(req.query.scan_id),
      file_type: req.query.file_type
    }
  }
  var response = req.query.response;
  if (!response)
    response = "excel";

  dbConnection
    .collection("Events")
    .find(options)
    .limit(5000)
    .toArray(function (err, result) {
      if (err) {
        console.log("Failed getEventsForMemory  " + err);
        res.status(404).send("No events");
      } else {
        //res.json(result);
        console.log("Success Calling fetch events");
        if (result && result.length > 0) {
          console.log("Found " + result.length + " " + file_type + " projects  ");
          if (response.toLowerCase() == "json") {
            console.log("Sending JSON back to caller....");
            res.jsonp(result);
            return;
          }
          var options = { flag: 'w' };
          fs.writeFile('/tmp/file_type.json', JSON.stringify(result), options, err => {
            if (err) {
              console.error(err);
            }
            console.log("Created file...");
            generateQueryFilteredExcel('/tmp/file_type.json', req, res, file_type + " Projects");
          });
          //res.status(200).jsonp(result);
        } else {
          res.status(404).send("No Events");
          console.log("No events");
        }
      }
    });
});

app.get("/getEventsByLibDependency", (req, res) => {
  console.log("getEventsByLibDependency Call for scan id = " + req.query.scan_id);
  var file_type = req.query.file_type;
  var options = {}
  if (!file_type || file_type.length == 0) {
    console.log("No file_type value found in request - returning all");
    options = {
      scan_id: Number.parseInt(req.query.scan_id)
    }
  } else {
    options = {
      scan_id: Number.parseInt(req.query.scan_id),
      file_type: req.query.file_type
    }
  }
  var response = req.query.response;
  if (!response)
    response = "excel";

  dbConnection
    .collection("Events")
    .find(options)
    .limit(5000)
    .toArray(function (err, result) {
      if (err) {
        console.log("Failed getEventsForMemory  " + err);
        res.status(404).send("No events");
      } else {
        //res.json(result);
        console.log("Success Calling fetch events");
        if (result && result.length > 0) {
          var m_array = [];
          for (i = 0; i < result.length; i++) {
            if (result[i].packagejson.dependencies.hasOwnProperty(req.query.dep)) {
              m_array.push(result[i]);
            }
          }
          console.log("Found " + m_array.length + " projects with " + req.query.dep + " library dependency");
          if (response.toLowerCase() == "json") {
            console.log("Sending JSON back to caller....");
            res.jsonp(m_array);
            return;
          }
          console.log("Found " + result.length + " " + file_type + " projects  ");
          if (response.toLowerCase() == "json") {
            console.log("Sending JSON back to caller....");
            res.jsonp(result);
            return;
          }
          var options = { flag: 'w' };
          fs.writeFile('/tmp/dep.json', JSON.stringify(result), options, err => {
            if (err) {
              console.error(err);
            }
            console.log("Created file...");
            generateQueryFilteredExcel('/tmp/dep.json', req, res, file_type + " Projects");
          });
          //res.status(200).jsonp(result);
        } else {
          res.status(404).send("No Events");
          console.log("No events");
        }
      }
    });
});
app.get("/getCountsOfUniqueLibs", (req, res) => {
  console.log("getCountsOfUniqueLibs Call for scan id = " + req.query.scan_id);
  var file_type = req.query.file_type;
  var options = {}
  if (!file_type || file_type.length == 0) {
    console.log("No file_type value found in request - returning all");
    options = {
      scan_id: Number.parseInt(req.query.scan_id)
    }
  } else {
    options = {
      scan_id: Number.parseInt(req.query.scan_id),
      file_type: req.query.file_type
    }
  }

  dbConnection
    .collection("Events")
    .find(options)
    .limit(5000)
    .toArray(function (err, result) {
      if (err) {
        console.log("Failed getEventsForMemory  " + err);
        res.status(404).send("No events");
      } else {
        //res.json(result);
        console.log("Success Calling fetch events: " + result.length);
        if (result && result.length > 0) {
          var m_array = [];
          for (i = 0; i < result.length; i++) {
            //console.log("Keys: " + Object.keys(result[i].packagejson.dependencies).length);
            m_array = m_array.concat(Object.keys(result[i].packagejson.dependencies));
          }
          console.log("Total Count of Deps: " + m_array.length);
          var result_object = {}
          for (i = 0; i < m_array.length; i++) {
            if (!result_object.hasOwnProperty(m_array[i])) {
              result_object[m_array[i]] = m_array.filter((currentElement) => currentElement == m_array[i]).length;
            }
          }

          console.log("Libs Counts: " + JSON.stringify(result_object));

          console.log("Sending JSON back to caller....");
          res.jsonp(result_object);
          return;


        }
      }
    });
});
function runShellScript(command) {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}
//Event Update Old
app.put("/events0/update", (req, res) => {
  console.log("Got an update request for scan id " + req.body.scan_id + " and project=" + req.body.project_name);
  const eventUpdateQuery = {
    project_name: req.body.project_name
  };
  console.log("Event update query body: " + JSON.stringify(req.body));
  const updates = {
    $set: {
      status: req.body.status,
      migration_notes: req.body.migration_notes
    },
  };

  dbConnection
    .collection("Events")
    .updateOne(eventUpdateQuery, updates, function (err, _result) {
      if (err) {
        console.error(JSON.stringify(err));
        res.status(400).send(`Error updating user id ${eventUpdateQuery._id}!`);
      } else {
        console.log("1 document updated");
        res.status(200).send("Success");
      }
    });
});

//New Event Update
app.put("/events/update", (req, res) => {
  console.log("Got an update request: " + JSON.stringify(req.body));
  const eventUpdateQuery = {
    project_name: req.body.project_name,
    "milestones.milestone_name": req.body.milestone_name
  };
  console.log("Event update query body: " + JSON.stringify(req.body));
  const updates = {
    $set: {
      "milestones.$.milestone_status": req.body.milestone_status,
      "milestones.$.milestone_notes": req.body.milestone_notes,
    },
  };

  dbConnection
    .collection("Events")
    .updateOne(eventUpdateQuery, updates, function (err, _result) {
      if (err) {
        console.error(JSON.stringify(err));
        res.status(400).send(`Error updating user id ${eventUpdateQuery._id}!`);
      } else {
        console.log("1 document updated");
        res.status(200).send("Success");
      }
    });
});
//Cancel Event
app.delete("/events/delete", (req, res) => {
  console.log("Received delete request for event id " + req.body.eventID);
  const query = {
    _id: new mongodb.ObjectID(req.body.eventID),
  };

  dbConnection.collection("Events").deleteOne(query, function (err, _result) {
    if (err) {
      res.status(400).send(`Error deleting event with id ${req.body.eventID}!`);
    } else {
      console.log("1 document deleted");
      res.status(200).send("Success");
    }
  });
});

//Create Subscription
app.post("/subscriptions/insert", (req, res) => {
  console.log("Subscription document = " + JSON.stringify(req.body));
  const subscriptionDocument = {
    user_id: req.body.user_id,
    email: req.body.email,
    subscribed_events: req.body.events,
    time_created: Date().toString(),
  };
  dbConnection
    .collection("Subscriptions")
    .insertOne(subscriptionDocument, function (err, result) {
      if (err) {
        console.error(JSON.stringify(err));
        res.status(400).send("Error inserting subscriptionDocument data!");
      } else {
        console.log(`Added a new subscription with id ${result.insertedId}`);
        res.status(201).send("Success");
      }
    });
});
app.get("/runShellScript", (req, res) => {
  console.log("Executing Shell Command - " + req.query.command + ", channel ID= " + req.query.id);
  const child = execSh(["cd ../PCFToOS-Scripts", req.query.command], true,
    (err, stdout, stderr) => {
      console.log("error: ", err);
      console.log("stdout: ", stdout);
      console.log("stderr: ", stderr);
    });
  res.send("Finished Command!")
});
//Subscriptions Update
app.put("/subscriptions/update", (req, res) => {
  const subscriptionsUpdateQuery = {
    _id: new mongodb.ObjectID(req.body.subscriptionID),
  };
  const updates = {
    $set: {
      user_id: req.body.user_id,
      email: req.body.email,
      subscribed_events: req.body.subscribed_events,
      time_created: Date().toString(),
    },
  };

  dbConnection
    .collection("Subscriptions")
    .updateOne(subscriptionsUpdateQuery, updates, function (err, _result) {
      if (err) {
        console.error(JSON.stringify(err));
        res
          .status(400)
          .send(`Error updating user id ${subscriptionsUpdateQuery._id}!`);
      } else {
        console.log("1 document updated");
        res.status(200).send("Success");
      }
    });
});
//Cancel Event
app.delete("/subscriptions/delete", (req, res) => {
  console.log(
    "Received delete request for subscription id " + req.body.subscriptionID
  );
  const query = {
    _id: new mongodb.ObjectID(req.body.subscriptionID),
  };

  dbConnection
    .collection("Subscriptions")
    .deleteOne(query, function (err, _result) {
      if (err) {
        res
          .status(400)
          .send(
            `Error deleting subscription with id ${req.body.subscriptionID}!`
          );
      } else {
        console.log("1 document deleted");
        res.status(200).send("Success");
      }
    });
});
//module.exports = recordRoutes;
// Listen for requests until the server is stopped

//app.use(cors());
var whitelist = [
  "http://localhost:5555",
  "http://localhost:8080",
  "https://pcf-to-os-web-concession-kiosk.pcf-to-ocp-migration-c6c44da74def18a795b07cc32856e138-0000.us-south.containers.appdomain.cloud",
  "https://pcf-to-openshift-web-concession-kiosk.pcf-to-ocp-migration-c6c44da74def18a795b07cc32856e138-0000.us-south.containers.appdomain.cloud",
  "http://pcf-ocf-mig.d3m0s4ndb0x.com:5555"
];
app.use(
  cors({
    origin: whitelist,
  })
);

const httpServer = http.createServer(app).listen(PORT, function (req, res) {
  console.log("listening on *:" + PORT);
});
const io = require("socket.io")(httpServer, {
  cors: {
    //origin: "http://localhost:3000",
    origin: whitelist,
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
  allowEIO3: true,
});
var mysocket = null;

io.on("connection", function (socket) {
  mysocket = socket;
  console.log("a user connected: socket id = " + socket.id);

  mysocket.emit("init-event", {
    text: "Today is a beautiful day",
    current_account_balance: 5603.73,
    savings_account_balance: 14569.25,
    credit_card_balance: 2306.23
  });
  socket.on("create-room", function (room) {
    if (room) {
      socket.join(room.channel);
      rooms.push(room.channel);
      console.log("Joined client socket to room " + room.channel);
    }
  });
  socket.on("store-form-data", function (context) {
    if (context) {
      console.log("Received store form data event request for email " + context.email);
      storeJourneyData(context);      
    }
  });
  socket.on("check-for-active-journey", function (data) {
          console.log("Received check for active journey event request for email " + data.email);
          getJourneyData(data.email);
  });
  socket.on("send-transactions", function (data) {
    console.log("Received get transactions event request for email " + data.email);
    GetRecentTransactions(data.email);
  });
  socket.on("leave", function (room) {
    console.log("#####Disconecting client socket from room " + room.channel);
    socket.leave(room.channel);
    rooms.pop(room.channel);
  });
});
