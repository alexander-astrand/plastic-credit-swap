<template>
  <nav>
    <div class="topBox">
      <img
        src="https://uploads-ssl.webflow.com/6313299a553f4107e9ec5a4f/6313424c3c13ed46c6d5f429_white2.png"
        loading="lazy"
        alt=""
        class="logo"
      />

      <ul class="navLinks">
        <li><NuxtLink to="/nftwrapper">NFT Wrapper</NuxtLink></li>
        <li><NuxtLink to="/tokenswapper">Token Swapper</NuxtLink></li>
        <li><NuxtLink to="/faq">FAQ</NuxtLink></li>
      </ul>

      <button
        class="walletButton"
        v-if="walletAddress == null"
        @click="connectWallet"
      >
        Connect Wallet
      </button>
      <div class="wallet" v-if="walletAddress !== null">
        Connected Wallet: {{ walletAddress }}
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  computed: {
    walletAddress() {
      return this.$store.state.walletAddress;
    },
  },
  methods: {
    connectWallet() {
      this.$store.dispatch("connectWallet");
    },
  },
};
</script>

<style>
nav {
  width: 85%;
}

.navLinks {
  display: flex;
  flex-direction: row;
  list-style: none;
  gap: 30px;
  justify-content: center;
  width: 50%;
  margin: 0;
  padding: 0;
}

.navLinks li a {
  text-decoration: none;
  color: rgba(255, 255, 255, 0.664);
  font-size: 25px;
}

.navLinks li a:hover {
  color: white;
}

.topBox {
  /* padding-top: 20px;
  padding-right: 20px;
  padding-left: 20px; */
  margin: 10px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: black;
  box-sizing: border-box;
}
.wallet {
  color: rgb(0, 193, 49);
  font-size: 15px;
}

.walletButton {
  background-color: rgb(0, 193, 49);
  color: black;
  border: none;
  border-radius: 5px;
  padding: 10px;
  cursor: pointer;
  font-size: 15px;
}
.walletButton:hover {
  background-color: rgb(2, 43, 12);
  color: white;
}
.logo {
  width: 300px;
}
</style>
