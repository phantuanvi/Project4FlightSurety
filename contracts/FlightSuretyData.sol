pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false

    mapping(address => bool) private authorizedCaller;

    mapping(address => Airline) private airlines;
    mapping(bytes32 => Flight) private flights;
    mapping(bytes32 => FlightInsurance) private flightInsurance;
    mapping(address => uint256) private passengerBalance;

    struct Airline {
        AirlineStatus status;
        address[] votes;
        uint256 funds;
    }

    struct FlightInsurance {
        mapping(address => uint256) purchasedAmount;
        address[] passengers;
        bool isPaidOut;
    }

    uint256 public registeredAirlineCount = 0;
    enum AirlineStatus {
        Nonmember,
        Nominated,
        Registered,
        Funded
    }
    AirlineStatus constant defaultStatus = AirlineStatus.Nonmember;

    struct Flight {
        bool isRegistered;
        address airline;
        string flight;
        uint256 updatedTimestamp;
        uint8 statusCode;
    }

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor(address firstAirlineAddress) public {
        contractOwner = msg.sender;
        authorizedCaller[contractOwner] = true;
        airlines[firstAirlineAddress] = Airline(
            AirlineStatus.Registered,
            new address[](0), // no votes
            0 // default no funding
        );
        registeredAirlineCount++;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireCallerAuthorized() {
        require(
            authorizedCaller[msg.sender] == true,
            "Caller is not authorized"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */

    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    function authorizeCaller(address _address)
        external
        requireIsOperational
        requireContractOwner
    {
        authorizedCaller[_address] = true;
    }

    function deauthorizeCaller(address _address)
        external
        requireIsOperational
        requireContractOwner
    {
        delete authorizedCaller[_address];
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function isStatusRegistered(address airlineAddress)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (bool)
    {
        return airlines[airlineAddress].status == AirlineStatus.Registered;
    }

    function isStatusRegisteredOrFunded(address airlineAddress)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (bool)
    {
        return
            airlines[airlineAddress].status == AirlineStatus.Registered ||
            airlines[airlineAddress].status == AirlineStatus.Funded;
    }

    function isStatusFunded(address airlineAddress)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (bool)
    {
        return airlines[airlineAddress].status == AirlineStatus.Funded;
    }

    function statusOfAirline(address airlineAddress)
        external
        view
        requireIsOperational
        returns (uint256)
    {
        return uint256(airlines[airlineAddress].status);
    }

    function numberVotesOfAirline(address airlineAddress)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (uint256)
    {
        return airlines[airlineAddress].votes.length;
    }

    function amountFundsOfAirline(address airlineAddress)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (uint256)
    {
        return airlines[airlineAddress].funds;
    }

    function nominateForAirline(address airlineAddress)
        external
        requireIsOperational
        requireCallerAuthorized
    {
        airlines[airlineAddress] = Airline(
            AirlineStatus.Nominated,
            new address[](0), // no votes
            0 // default no funding
        );
    }

    function voteForAirline(address airlineAddress, address voterAddress)
        external
        requireIsOperational
        requireCallerAuthorized
        returns (uint256)
    {
        airlines[airlineAddress].votes.push(voterAddress);
        return airlines[airlineAddress].votes.length;
    }

    function fundOfAirline(address airlineAddress, uint256 amountFund)
        external
        requireIsOperational
        requireCallerAuthorized
        returns (uint256)
    {
        airlines[airlineAddress].funds = airlines[airlineAddress].funds.add(
            amountFund
        );
        airlines[airlineAddress].status = AirlineStatus.Funded;
        return airlines[airlineAddress].funds;
    }

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address airlineAddress)
        external
        requireIsOperational
        requireCallerAuthorized
        returns (bool)
    {
        airlines[airlineAddress].status = AirlineStatus.Registered;
        registeredAirlineCount++;
        return airlines[airlineAddress].status == AirlineStatus.Registered;
    }

    /********************************************************************************************/
    /*                                       FLIGHT                                             */
    /********************************************************************************************/

    function registerFlight(
        address airline,
        string flight,
        uint256 updatedTimestamp,
        uint8 statusCode
    ) external requireIsOperational requireCallerAuthorized returns (bool) {
        bytes32 key = getFlightKey(airline, flight, updatedTimestamp);
        flights[key] = Flight({
            isRegistered: true,
            airline: airline,
            flight: flight,
            updatedTimestamp: updatedTimestamp,
            statusCode: statusCode
        });
        return flights[key].isRegistered;
    }

    function updateStatusOfFlight(uint8 statusCode, bytes32 flightKey)
        external
        requireIsOperational
        requireCallerAuthorized
    {
        flights[flightKey].statusCode = statusCode;
    }

    function isFlightRegistered(bytes32 flightKey)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (bool)
    {
        return flights[flightKey].isRegistered;
    }

    function getStatusOfFlight(bytes32 flightKey)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (uint8)
    {
        return flights[flightKey].statusCode;
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /********************************************************************************************/
    /*                                       INSURANCE                                          */
    /********************************************************************************************/

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buyInsurance(
        address passengerAddress,
        uint256 insuranceAmount,
        bytes32 flightKey
    ) external requireIsOperational requireCallerAuthorized {
        flightInsurance[flightKey].purchasedAmount[
            passengerAddress
        ] = insuranceAmount;
        flightInsurance[flightKey].passengers.push(passengerAddress);
    }

    function isPassengerInsured(address passengerAddress, bytes32 flightKey)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (bool)
    {
        return flightInsurance[flightKey].purchasedAmount[passengerAddress] > 0;
    }

    function isPaidOut(bytes32 flightKey)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (bool)
    {
        return flightInsurance[flightKey].isPaidOut;
    }

    function currentPassengerBalance(address passengerAddress)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (uint256)
    {
        return passengerBalance[passengerAddress];
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees(bytes32 flightKey, address airlineAddress)
        external
        requireIsOperational
        requireCallerAuthorized
    {
        require(
            !flightInsurance[flightKey].isPaidOut,
            "Flight insurance already paid out"
        );
        for (
            uint256 i = 0;
            i < flightInsurance[flightKey].passengers.length;
            i++
        ) {
            address passengerAddress = flightInsurance[flightKey].passengers[i];
            uint256 purchasedAmount = flightInsurance[flightKey]
                .purchasedAmount[passengerAddress];
            uint256 payoutAmount = purchasedAmount.mul(3).div(2);
            passengerBalance[passengerAddress] = passengerBalance[
                passengerAddress
            ].add(payoutAmount);
            airlines[airlineAddress].funds.sub(payoutAmount);
        }
        flightInsurance[flightKey].isPaidOut = true;
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function payPassenger(address insured, uint256 amount)
        external
        requireIsOperational
        requireCallerAuthorized
    {
        require(amount<=passengerBalance[insured], "Withdrawal exceeds account balance");
        passengerBalance[insured] = passengerBalance[insured].sub(amount);
        insured.transfer(amount);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    // function fund() public payable {}

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    // function() external payable {
    //     fund();
    // }
}
