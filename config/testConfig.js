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

    oracles = accounts.slice(10,30);

    let flightSuretyData = await FlightSuretyData.new(testAddresses.airline1);
    let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

    console.log(`Contract flightSuretyData address: ${flightSuretyData.address}`);
    console.log(`Contract flightSuretyApp address: ${flightSuretyApp.address}`);
    console.log(testAddresses);
    console.log("-------------------");
    oracles.forEach(async (oracleAccount, index) => {
        console.log(`oracles address ${index+1}: ${oracleAccount}`);
    })
    
    return {
        contractOwner: testAddresses.contractOwner,
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp,
        oracles: oracles
    }
}

module.exports = {
    Config: Config
};