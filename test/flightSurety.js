var Test = require("../config/testConfig.js");

contract("Flight Surety Tests", async (accounts) => {
  let config;
  let flightSuretyData;
  let flightSuretyApp;
  let testAddresses;

  before("setup contract", async () => {
    config = await Test.Config(accounts);
    flightSuretyData = config.flightSuretyData;
    flightSuretyApp = config.flightSuretyApp;
    testAddresses = config.testAddresses;
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/
  describe('Operational status control', () => {
    it(`(multiparty) has correct initial isOperational() value`, async () => {
      let status = await flightSuretyData.isOperational();
      assert.equal(status, true, "Incorrect initial operating status value");
    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async () => {
      let accessDenied = false;
      try {
        await flightSuretyData.setOperatingStatus(false, {
          from: testAddresses.airline2,
        });
      } catch (e) {
        accessDenied = true;
      }
      assert.equal(
        accessDenied,
        true,
        'Access not restricted to Contract Owner'
      );
    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async () => {
      let accessDenied = false;
      try {
        await flightSuretyData.setOperatingStatus(false, { from: config.contractOwner });
      } catch (e) {
        accessDenied = true;
      }
      assert.equal(
        accessDenied,
        false,
        'Access not restricted to Contract Owner'
      );
    });

    it(`(multiparty) Can block access to functions using requireIsOperational when operating status is false`, async () => {
      await flightSuretyData.setOperatingStatus(false, {from: config.contractOwner});
      let reverted = false;
      try {
        await flightSuretyData.registerAirline(testAddresses.airline2, {from: airline1});
      } catch (e) {
        reverted = true;
      }
      assert.equal(
        reverted,
        true,
        'Access not blocked for requireIsOperational'
      );
      //Set it back for other tests to work
      await flightSuretyData.setOperatingStatus(true, {from: config.contractOwner});
    });
  });

//   it("(airline) cannot register an Airline using registerAirline() if it is not funded", async () => {
    // ARRANGE
//     let newAirline = accounts[2];

    // ACT
//     try {
//       await config.flightSuretyApp.registerAirline(newAirline, {
//         from: config.firstAirline,
//       });
//     } catch (e) {}
//     let result = await config.flightSuretyData.isAirline.call(newAirline);

    // ASSERT
//     assert.equal(
//       result,
//       false,
//       "Airline should not be able to register another airline if it hasn't provided funding"
//     );
//   });
});
