var Test = require("../config/testConfig.js");
const { expect } = require('chai');

const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  balance,
  ether,
} = require('@openzeppelin/test-helpers');

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
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address)
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/
  describe('Operational status control', () => {
    it(`(multiparty) has correct initial isOperational() value`, async () => {
      let status = await flightSuretyApp.isOperational();
      assert.equal(status, true, "Incorrect initial operating status value");
    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async () => {
      let accessDenied = false;
      try {
        await flightSuretyApp.setOperatingStatus(false, {
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
        await flightSuretyData.registerAirline(testAddresses.airline2, {from: airline3});
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

  describe('Business Logic of Airlines', () => {
    it('First airline is registered when contract is deployed.', async () => {
      let tran;
      try {
        tran = await flightSuretyApp.isStatusRegistered(testAddresses.airline1);
      } catch (error) {
        console.log(`>>>>>>>>>>> error: ${error}`);
      }
      assert.equal(tran, true, 'First airline is registered when contract is deployed');
    });

    it('First airline can registered the second airline.', async () => {
      let tran;
      try {
        tran = await flightSuretyApp.registerAirline(testAddresses.airline2, { from: testAddresses.airline1 });
      } catch (error) {
        console.log(`>>>>>>>>>>> error: ${error}`);
      }
      expectEvent(tran, 'AirlineRegistered', {
        airlineAddress: testAddresses.airline2,
      });
    });

    it('Second airline can registered the third airline.', async () => {
      let tran;
      try {
        tran = await flightSuretyApp.registerAirline(testAddresses.airline3, { from: testAddresses.airline2 });
      } catch (error) {
        console.log(`>>>>>>>>>>> error: ${error}`);
      }
      expectEvent(tran, 'AirlineRegistered', {
        airlineAddress: testAddresses.airline3,
      });
    });

    it('Third airline can registered the fourth airline.', async () => {
      let tran;
      try {
        tran = await flightSuretyApp.registerAirline(testAddresses.airline4, { from: testAddresses.airline3 });
      } catch (error) {
        console.log(`>>>>>>>>>>> error: ${error}`);
      }
      expectEvent(tran, 'AirlineRegistered', {
        airlineAddress: testAddresses.airline4,
      });
    });

    it('Registration of the fifth airline', async () => {
      let fundingAmount = ether('10');
      let tran1;
      try {
        tran1 = await flightSuretyApp.fundOfAirline(testAddresses.airline1, { from: testAddresses.airline1 , value: fundingAmount });
      } catch (error) {
        console.log(`>>>>>>>>>>> error: ${error}`);
      }
      expectEvent(tran1, 'AirlineFunded', {
        airlineAddress: testAddresses.airline1,
        amount: fundingAmount
      });

      let tran2;
      try {
        tran2 = await flightSuretyApp.fundOfAirline(testAddresses.airline2, { from: testAddresses.airline2 , value: fundingAmount });
      } catch (error) {
        console.log(`>>>>>>>>>>> error: ${error}`);
      }
      expectEvent(tran2, 'AirlineFunded', {
        airlineAddress: testAddresses.airline2,
        amount: fundingAmount
      });

      let tran3;
      try {
        tran3 = await flightSuretyApp.fundOfAirline(testAddresses.airline3, { from: testAddresses.airline3 , value: fundingAmount });
      } catch (error) {
        console.log(`>>>>>>>>>>> error: ${error}`);
      }
      expectEvent(tran3, 'AirlineFunded', {
        airlineAddress: testAddresses.airline3,
        amount: fundingAmount
      });
      
      let tran4;
      try {
        tran4 = await flightSuretyApp.nominateForAirline(testAddresses.airline5, { from: testAddresses.airline1 });
      } catch (error) {
        console.log(`>>>>>>>>>>> error: ${error}`);
      }
      expectEvent(tran4, 'AirlineNominated', {
        airlineAddress: testAddresses.airline5,
      });
      
      let tran5;
      try {
        tran5 = await flightSuretyApp.voteForAirline(testAddresses.airline5, testAddresses.airline2, { from: testAddresses.airline2 });
      } catch (error) {
        console.log(`>>>>>>>>>>> error: ${error}`);
      }
      
      expectEvent(tran5, 'AirlineVoted', {
        airlineAddress: testAddresses.airline5,
        voterAddress: testAddresses.airline2
      });

      let tran6;
      try {
        tran6 = await flightSuretyApp.voteForAirline(testAddresses.airline5, testAddresses.airline3, { from: testAddresses.airline3 });
      } catch (error) {
        console.log(`>>>>>>>>>>> error: ${error}`);
      }
      
      expectEvent(tran6, 'AirlineVoted', {
        airlineAddress: testAddresses.airline5,
        voterAddress: testAddresses.airline3
      });

      let votes = await flightSuretyApp.numberVotesOfAirline.call(testAddresses.airline5);
      assert.equal(votes, 2, 'Expect two votes for Airline5');

      let tran7;
      try {
        tran7 = await flightSuretyApp.isStatusRegistered(testAddresses.airline5);
      } catch (error) {
        console.log(`>>>>>>>>>>> error: ${error}`);
      }
      assert.equal(tran7, false, 'Airline5 is not registered');

      let tran8;
      try {
        tran8 = await flightSuretyApp.registerAirline(testAddresses.airline5, { from: testAddresses.airline1 });
      } catch (error) {
        console.log(`>>>>>>>>>>> error: ${error}`);
      }
      expectEvent(tran8, 'AirlineRegistered', {
        airlineAddress: testAddresses.airline5,
      });
    });

  });
});
