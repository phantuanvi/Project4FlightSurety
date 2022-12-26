<template>
  <div class="hello">
    <nav class="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
      <a class="navbar-brand" href="#">FlightSurety</a>
    </nav>

    <main class="container">
      <div class="row top-20">
          <label class="form">Select Airline</label>
          <select
            id="airlines"
            type="text"
            v-model="selectedAirline"
            @change="selectedAirlineChoose(airline)"
          >
            <option v-for="airline in airlines" :key="airline">
              {{ airline }}
            </option>
          </select>
        </div>
      <div class="row top-20">
        <label class="form">Select Flight</label>
        <select
          id="flights"
          type="text"
          v-model="selectedFlight"
          @change="selectedFlightChoose(flight)"
        >
          <option v-for="flight in flights" :key="flight">
            {{ flight.flight }}
          </option>
        </select>
        <button @click="fetchFlightStatus" style="margin: 10px 20px">Fetch Status</button>
      </div>

      <div class="row top-20">
        <label class="form">Insurance of passengers:</label>
        Amount: <input v-model="amountBuyInsurance"
          type="text"
        />
        <button @click="buyInsuranceForFlight">
          Buy Insurance
        </button>
      </div>

      <div class="row top-20">
        <label class="form">Balance of passengers:</label>
        Address passengers:<input
          type="text"
        />
        <button @click="passengerBalance">
          Balance of passengerss
        </button>
      </div>
      
    </main>
  </div>
</template>

<script>
import Contract from "../contract";
import Config from "../assets/config.json";

export default {
  name: "HomePage",
  data() {
    return {
      config: Config,
      contract: new Contract("localhost", () => {}),
      accounts: [],
      owner: "",
      flights: [],
      airlines: [],
      selectedAirline: "",
      selectedFlight: "",
      amountBuyInsurance: 0
    };
  },
  created() {
    console.log("created");
    this.contract.web3.eth.getAccounts((error, accounts) => {
      this.accounts = accounts;
      this.owner = accounts[0];
      this.airlines = accounts.slice(1, 6);
    });

    for (let index = 0; index < 5; index++) {
      this.flights.push({
        airline: this.airlines[0],
        flight: `Flight ${index + 1}`,
        timestamp: Math.floor(Date.now() / 1000),
      });
    }
  },

  methods: {
    selectedAirlineChoose() {
      console.log(`selectedAirline: ${this.selectedAirline}`);
    },

    selectedFlightChoose() {
      console.log(`selectedFlight: ${this.selectedFlight}`);
    },

    fetchFlightStatus() {
      let airlineAddress = this.selectedAirline;
      let flight = this.selectedFlight;
      let timestamp = Math.floor(Date.now() / 1000);
      console.log(`this.selectedAirline: ${this.selectedAirline}, this.selectedFlight: ${this.selectedFlight}, timestamp: ${timestamp}`);
      this.contract.flightSuretyApp.methods
        .fetchFlightStatus(airlineAddress, flight, timestamp)
        .call({ from: this.owner })
        .then(function (res) {
          console.log(res);
        })
        .catch(function (err) {
          console.log(err);
        });
    },

    isOperational() {
      this.contract.flightSuretyApp.methods
        .isOperational()
        .call({ from: this.owner })
        .then(function (res) {
          console.log(res);
        })
        .catch(function (err) {
          console.log(err);
        });
    },

    registerFlight(flightName) {
      let timestamp = Math.floor(Date.now() / 1000);
      this.contract.flightSuretyApp.methods
        .registerFlight(flightName, timestamp)
        .call({ from: this.owner })
        .then(function (res) {
          console.log(res);
        })
        .catch(function (err) {
          console.log(err);
        });
    },

    buyInsuranceForFlight() {
      let address = this.owner;
      let timestamp = Math.floor(Date.now() / 1000);
      this.contract.flightSuretyApp.methods
        .buyInsuranceForFlight(address, this.selectedFlight, timestamp)
        .send({ from: this.owner, value: this.amountBuyInsurance,  gas:"999999" })
        .then(function (res) {
          console.log(res);
        })
        .catch(function (err) {
          console.log(err);
        });
    },

    passengerBalance(passengerAddress) {
      passengerAddress = this.owner;
      this.contract.flightSuretyApp.methods
        .passengerBalance(passengerAddress)
        .call({ from: this.owner })
        .then(function (res) {
          console.log(res);
        })
        .catch(function (err) {
          console.log(err);
        });
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.container {
  margin-top: 400px;
  background-color: #000;
  opacity: 0.9;
  color: #fff;
  padding: 40px;
}

.top-20 {
  margin-top: 20px;
}

h5 {
  color: #999999;
}

section {
  margin-bottom: 50px;
}

.field {
  font-weight: bold;
  text-align: right;
}

.field-value {
  color: #0e7fa8;
}

label.form {
  font-size: 14px;
  margin-right: 20px;
}
input {
  margin-right: 30px;
}
</style>
