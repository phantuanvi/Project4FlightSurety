import FlightSuretyApp from '../../../build/contracts/FlightSuretyApp.json';
import Config from './assets/config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
    }
}