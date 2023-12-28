<template>
    <div>
      <h1>Plastic Credit NFT - Wrapper</h1>
      <h2>Choose which credit collection to wrap</h2>
      <ul>
        <li
          v-for="(item, index) in creditBalances"
          :key="index"
          v-if="item.amountActive !== '0'"
        >
          <input
            type="radio"
            :id="'radio-' + index"
            name="creditBalanceSelection"
            :value="index"
            v-model="selectedId"
          />
          <input
            type="number"
            :id="'amount-' + index"
            :name="'amount-' + index"
            v-model="item.selectedAmount"
            min="1"
            :max="item.amountActive"
          />
          <label :for="'radio-' + index">
            Active Amount: {{ item.amountActive }} <br />
            ID: {{ item.creditCollection.denom }}
          </label>
        </li>
      </ul>
      <button @click="wrapNFT">Wrap NFT</button>
      <div v-if="error">Error: {{ error }}</div>
    </div>
  </template>
  

<script>
import { request, gql } from "graphql-request";
import { watch } from "vue";

export default {
  data() {
    return {
      creditBalances: [],
      error: null,
      selectedId: null,
    };
  },
  computed: {
    walletAddress() {
      return this.$store.state.walletAddress;
    },
  },

  mounted() {
    watch(
      () => this.walletAddress,
      (newAddress, oldAddress) => {
        if (newAddress && newAddress !== oldAddress) {
          this.fetchGraphQLData();
        }
      },
      { immediate: true }
    );
  },

  methods: {
    async fetchGraphQLData() {
      if (!this.walletAddress) {
        this.error = "Wallet address is not connected.";
        return;
      }

      const query = gql`
        query Wallet($id: String!) {
          wallet(id: $id) {
            creditBalances {
              nodes {
                amountActive
                creditCollection {
                  denom
                  metadataUris {
                    nodes {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      `;

      try {
        const response = await request(
          "https://testnet.empowerchain.io:3000/",
          query,
          {
            id: this.walletAddress,
          }
        );
        console.log(response);
        this.creditBalances = response.wallet.creditBalances.nodes;
      } catch (error) {
        this.error = error.message;
      }
    },

    async wrapNFT() {
      if (this.selectedId === null) {
        this.error = "Please select a credit collection.";
        return;
      }

      const selectedCollection = this.creditBalances[this.selectedId];
      if (!selectedCollection) {
        this.error = "Selected credit collection not found.";
        return;
      }

      const denom = selectedCollection.creditCollection.denom;
      const amountToWrap = selectedCollection.selectedAmount;
      const address = this.walletAddress;

      try {
        const result = await this.$axios.post("/api/fetch-and-mint-plastic-credit", { 
          denom, 
          amountToWrap,
          address,
        });
        console.log(result);
        // Handle the response as needed
      } catch (error) {
        console.error("Error sending data to the server", error);
        this.error = "Failed to send data to the server.";
      }
    },
  },
};
</script>
