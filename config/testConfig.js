var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");

var Config = async (accounts) => {

    let testAddresses = {
        contractOwner : accounts[0],
        airline1 : accounts[1],
        airline2 : accounts[2],
        airline3 : accounts[3],
        airline4 : accounts[4],
        airline5 : accounts[5],
        passenger1 : accounts[6],
        passenger2 : accounts[7],
        passenger3 : accounts[8],
        passenger4 : accounts[9]
    }

    let flightSuretyData = await FlightSuretyData.deployed();
    let flightSuretyApp = await FlightSuretyApp.deployed();

    console.log(`Contract flightSuretyData address: ${flightSuretyData.address}`);
    console.log(`Contract flightSuretyApp address: ${flightSuretyApp.address}`);
    console.log(testAddresses);

    return {
        contractOwner: testAddresses.contractOwner,
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};