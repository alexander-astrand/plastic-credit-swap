<template>
  <div class="wrapPage">
    <h1 class="mainTitle">Plastic Credit NFT Wrapper</h1>
    <h2 class="secondaryTitle">
      Turn your plastic credits into IBC compatible CW-721 tokens
    </h2>
    <div class="wrapBox">
      <div v-if="loading" class="loading">
        <rotate-loader
          :loading="loading"
          :color="color"
          :size="size"
        ></rotate-loader>
      </div>
      <div v-if="!loading">
        <div class="tabs">
          <button
            :class="{ selectedTab: currentTab === 'wrapper' }"
            @click="currentTab = 'wrapper'"
          >
            Wrapper
          </button>
          <button
            :class="{ selectedTab: currentTab === 'unwrapper' }"
            @click="currentTab = 'unwrapper'"
          >
            Unwrapper
          </button>
        </div>
        <div v-if="walletAddress == null">
          <h2>Sign in with wallet</h2>
        </div>
        <div v-if="walletAddress !== null">
          <div v-if="currentTab === 'wrapper'">
            <p class="collectionText">
              Choose which credit collection to wrap from:
            </p>
            <div class="dropdownBox">
              <select class="dropDown" v-model="selectedId">
                <option disabled value="">Please select one</option>
                <option
                  v-for="(item, index) in creditBalances"
                  :key="index"
                  :value="index"
                  v-if="item.amountActive !== '0'"
                >
                  {{ item.creditCollection.denom }}
                </option>
              </select>
            </div>
            <div class="amountBox" v-if="selectedId !== null">
              <p>Amount avaliable to wrap: {{ maxAmount }}</p>
              <p>Select amount to wrap:</p>
              <input
                type="number"
                v-model="selectedAmount"
                min="1"
                :max="maxAmount"
              />
              <button @click="wrapNFT">Wrap NFT</button>
            </div>
            <div class="error" v-if="error">Error: {{ error }}</div>
          </div>

          <div v-if="currentTab === 'unwrapper'">
            <h2>Choose which NFT to unwrap (TokenID):</h2>

            <!-- Dropdown for selecting NFT -->
            <div class="dropdownBox">
              <select class="dropDown" v-model="selectedNFTId">
                <option disabled value="">Please select an NFT</option>
                <option v-for="nftId in nfts" :key="nftId" :value="nftId">
                  {{ nftId }}
                </option>
              </select>
            </div>
            <!-- Unwrap Button -->
            <button v-if="selectedNFTId !== null" @click="unwrapNFT">
              Unwrap
            </button>

            <!-- Display error message if any -->
            <div class="error" v-if="error">Error: {{ error }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { request } from "graphql-request";
import { walletQuery } from "../utils/graphQlQuery";
import { watch } from "vue";
import RotateLoader from "vue-spinner/src/RotateLoader.vue";
import Swal from "sweetalert2";
import { ref } from "vue";
require("dotenv").config();
import { grantAuthorization } from "../utils/grantPcTransferAuthorization";
import { approveNFT } from "../utils/nftWrapperFunctions/approveNft";

export default {
  components: {
    RotateLoader,
  },

  data() {
    return {
      creditBalances: ref([]),
      error: null,
      selectedId: null,
      selectedAmount: 1, // default amount
      selectedNFTId: null,
      nfts: ref([]),
      currentTab: "wrapper",
      loading: false,
      color: "red", // Color of the spinner
      size: "15px", // Size of the spinner
      denom: ref(""),
      amountToWrap: ref(""),
      offlineSigner: window.getOfflineSigner(process.env.NUXT_ENV_CHAIN_ID),
    };
  },

  computed: {
    walletAddress() {
      return this.$store.state.walletAddress;
    },
    maxAmount() {
      if (
        this.selectedId !== null &&
        this.creditBalances.length > this.selectedId
      ) {
        return this.creditBalances[this.selectedId].amountActive;
      }
      return 0;
    },
  },

  mounted() {
    watch(
      () => this.walletAddress,
      (newAddress, oldAddress) => {
        if (newAddress && newAddress !== oldAddress) {
          this.fetchGraphQLData();
          this.queryNFTs();
        }
      },
      { immediate: true }
    );
    watch(
      () => this.selectedId,
      (newId, oldId) => {
        if (newId && newId !== oldId) {
          this.denom = this.creditBalances[newId].creditCollection.denom;
          console.log(this.denom);
        }
      },
      { immediate: true }
    );
  },

  methods: {
    async fetchGraphQLData() {
      if (!this.walletAddress) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Wallet not connected, please connect wallet",
          footer: '<a href="#">Why do I have this issue?</a>',
        });
        return;
      }
      this.loading = true;

      try {
        const response = await request(
          "https://testnet.empowerchain.io:3000/",
          walletQuery,
          {
            id: this.walletAddress,
          }
        );
        console.log(response);
        this.creditBalances = response.wallet.creditBalances.nodes;
        this.denom = this.creditBalances[0].creditCollection.denom;
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.message,
          footer: '<a href="#">Why do I have this issue?</a>',
        });
      }
      this.loading = false;
    },

    async wrapNFT() {
      this.loading = true;

      console.log(this.denom, this.selectedAmount);

      if (this.selectedId === null) {
        this.error = "Please select a credit collection.";
        this.loading = false;
        return;
      }

      const selectedCollection = this.creditBalances[this.selectedId];
      if (!selectedCollection) {
        this.error = "Selected credit collection not found.";
        this.loading = false;
        return;
      }

      try {
        // Attempt to grant authorization
        const isAuthorized = await grantAuthorization(
          this.walletAddress,
          this.offlineSigner,
          this.denom,
          this.selectedAmount
        );

        if (!isAuthorized) {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Authorization failed. Please try again.",
            footer: '<a href="#">Why do I have this issue?</a>',
          });
          return;
        }
      } catch (error) {
        console.error("Authorization error:", error);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Authorization failed. Please try again.",
          footer: '<a href="#">Why do I have this issue?</a>',
        });
        return;
      } finally {
        this.loading = false;
      }

      let denom = this.denom;
      let amountToWrap = this.selectedAmount; // Ensure this is bound correctly
      const address = this.walletAddress;

      try {
        const result = await this.$axios.post(
          "/api/fetch-and-mint-plastic-credit",
          {
            denom,
            amountToWrap,
            address,
          }
        );
        console.log(result);

        setTimeout(() => {
          this.queryNFTs();
          this.fetchGraphQLData();
          this.selectedId = null;
          this.selectedAmount = 1;
          Swal.fire({
            title: "Congratulations!",
            text: "You wrapped the Plastic Credits!",
            icon: "success",
          });
        }, 7000);
      } catch (error) {
        console.error("Error sending data to the server", error);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to send data to server.",
          footer: '<a href="#">Why do I have this issue?</a>',
        });
      } finally {
        this.loading = false;
      }
    },

    async unwrapNFT() {
      this.loading = true;

      try {
        // First, get the approval
        await approveNFT(
          this.selectedNFTId,
          this.offlineSigner,
          this.walletAddress
        );

        // Then proceed with the unwrapping process
        const result = await this.$axios.post("/api/unwrap-nft", {
          token_id: this.selectedNFTId,
        });
        console.log(result);
        setTimeout(() => {
          this.selectedActiveAmount = 0;
          this.queryNFTs();
          this.fetchGraphQLData();
          this.loading = false;
          Swal.fire({
            title: "Congratulations!",
            text: "You unwrapped your NFT",
            icon: "success",
          });
        }, 4000);
        // Further handling
      } catch (error) {
        console.error("Error during unwrap operation", error);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to unwrap NFT.",
          footer: '<a href="#">Why do I have this issue?</a>',
        });
        this.loading = false;
      }
    },

    async queryNFTs() {
      this.loading = true;
      try {
        const result = await this.$axios.post("/api/query-nfts", {
          walletAddress: this.walletAddress,
        });
        console.log(result);
        console.log(result.data.queryResult.tokens);
        this.nfts = result.data.queryResult.tokens;
        // Handle the response as needed
      } catch (error) {
        console.error("Error sending data to the server", error);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to send data to server.",
          footer: '<a href="#">Why do I have this issue?</a>',
        });
      }
      this.loading = false;
    },
  },
  watch: {
    selectedNFTId(newVal) {
      console.log("Selected NFT ID:", newVal);
      this.selectedNFTId = newVal;
    },
    selectedId(newVal) {
      console.log("Selected ID:", newVal);
      this.selectedId = newVal;
    },
  },
};
</script>

<style>
html,
body {
  font-family: sans-serif;
  background-color: black;
  box-sizing: border-box;
}
.wrapPage {
  background-color: black;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-sizing: border-box;
}

.tabs {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.tabs button {
  margin: 5px;
  margin-top: 15px;
  padding: 10px;
  font-size: 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.mainTitle {
  color: white;
  margin-bottom: 0px;
  font-size: 50px;
}

.dropDown {
  font-size: 20px;
  padding: 5px;
  border-radius: 5px;
  border: none;
  background-color: lightgray;
  cursor: pointer;
}

.collectionText {
  font-size: 25px;
  font-weight: bold;
}

.wrapBox {
  padding: 10px;
  background-color: rgb(0, 193, 49);
  width: 40%;
  height: 40%;
  border-radius: 5%;
  box-shadow: 0px 0px 20px 5px rgb(201, 9, 185);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  overflow: auto;
}

.error {
  color: red;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.selectedTab {
  background-color: rgb(2, 43, 12);
  color: white;
}

.amountBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.amountBox p {
  font-size: 20px;
  margin: 0;
}
.dropdownBox {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}
</style>
