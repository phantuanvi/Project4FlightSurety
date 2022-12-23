import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";
import express from "express";

let config = Config["localhost"];
let web3 = new Web3(
  new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
);
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(
  FlightSuretyApp.abi,
  config.appAddress
);

let oraclesAccount = [];

web3.eth.getAccounts().then((accounts) => {
  flightSuretyApp.methods
    .REGISTRATION_FEE()
    .call({
      from: accounts[0],
      gas: 5000000,
      gasPrice: 100000000000,
    })
    .then((fee) => {
      for (var a = 10; a < 30; a++) {
        let account = accounts[a];
        oraclesAccount.push(account);

        flightSuretyApp.methods
          .registerOracle()
          .send({
            from: account,
            value: fee,
            gas: 5000000,
            gasPrice: 100000000000,
          })
          .then((result) => {
            console.log(`Register Oracle account: ${account}`);
          })
          .catch((error) => {
            console.log(`Error: ${error}`);
          });
      }

      oraclesAccount.forEach((oracle) => {
        flightSuretyApp.methods
          .getMyIndexes()
          .call({
            from: oracle,
            gas: 5000000,
            gasPrice: 100000000000,
          })
          .then((result) => {
            console.log(`getMyIndexes: ${result} for oracle: ${oracle}`);
          })
          .catch((error) => {
            console.log(`Error: ${error}`);
          });
      });

      flightSuretyApp.events.OracleRequest(
        {
          fromBlock: "latest",
        },
        function (error, event) {
          if (error) console.log(error);
          console.log(event);

          const flight = event.returnValues.flight;
          const airline = event.returnValues.airline;
          const timestamp = event.returnValues.timestamp;

          let found = false;

          let selectedCode = {
            label: "STATUS_CODE_ON_TIME",
            code: 10,
          };
          const scheduledTime = timestamp * 1000;

          if (scheduledTime < new Date().getTime()) {
            selectedCode = {
              label: "STATUS_CODE_LATE_AIRLINE",
              code: 20,
            };
          }
          oracles.forEach((oracle, index) => {
            if (found) {
              return false;
            }
            for (let idx = 0; idx < 3; idx += 1) {
              if (found) break;
              flightSuretyApp.methods
                .submitOracleResponse(
                  oracle[idx],
                  airline,
                  flight,
                  timestamp,
                  selectedCode.code
                )
                .send({
                  from: accounts[index],
                })
                .then((rs) => {
                  found = true;
                })
                .catch((error) => {
                  console.log(`Error: ${error}`);
                });
            }
          });
        }
      );
    })
    .catch((err) => {
      console.log(`Error: ${err}`);
    });
});

const app = express();
app.get("/api", (req, res) => {
  res.send({
    message: "An API for use with your Dapp!",
  });
});

export default app;
