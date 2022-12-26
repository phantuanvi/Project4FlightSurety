var Test = require("../config/testConfig.js");
const { expect } = require("chai");

const {
  BN, // Big Number support
  constants, // Common constants, like the zero address and largest integers
  expectEvent, // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  balance,
  ether,
} = require("@openzeppelin/test-helpers");

contract("Oracles", async (accounts) => {
  const TEST_ORACLES_COUNT = 20;
  let config;
  let flightSuretyData;
  let flightSuretyApp;
  let testAddresses;
  let oraclesAddresses;

  before("setup contract", async () => {
    config = await Test.Config(accounts);
    flightSuretyData = config.flightSuretyData;
    flightSuretyApp = config.flightSuretyApp;
    testAddresses = config.testAddresses;
    oraclesAddresses = config.oracles;
    await config.flightSuretyData.authorizeCaller(
      config.flightSuretyApp.address
    );

    // Watch contract events
    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;
  });

  it("can register oracles", async () => {
    // ARRANGE
    let fee = await flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for (let a = 1; a < TEST_ORACLES_COUNT; a++) {
      await flightSuretyApp.registerOracle({
        from: oraclesAddresses[a],
        value: fee,
      });
      let result = await flightSuretyApp.getMyIndexes.call({
        from: oraclesAddresses[a],
      });
      console.log(`Oracle Registered: ${result}`);
    }
  });

  it("can request flight status", async () => {
    // ARRANGE
    let flight = "ND1309"; // Course number
    let timestamp = Math.floor(Date.now() / 1000);

    // Submit a request for oracles to get status information for a flight
    let result = await flightSuretyApp.fetchFlightStatus(
      testAddresses.airline1,
      flight,
      timestamp
    );

    expectEvent(result, 'OracleRequest');
    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    // for (let a = 1; a < TEST_ORACLES_COUNT; a++) {
    //   // Get oracle information
    //   let oracleIndexes = await flightSuretyApp.getMyIndexes.call({
    //     from: oraclesAddresses[a],
    //   });
    //   for (let idx = 0; idx < 3; idx++) {
    //     try {
    //       // Submit a response...it will only be accepted if there is an Index match
    //       await flightSuretyApp.submitOracleResponse(
    //         oracleIndexes[idx],
    //         testAddresses.airline1,
    //         flight,
    //         timestamp,
    //         STATUS_CODE_ON_TIME,
    //         { from: oraclesAddresses[a] }
    //       );
    //     } catch (e) {
    //       // Enable this when debugging
    //       console.log(
    //         "\nError",
    //         idx,
    //         oracleIndexes[idx].toNumber(),
    //         flight,
    //         timestamp
    //       );
    //     }
    //   }
    // }
  });
});
