<template>
  <nav>
    <div class="topBox">
      <a href="https://www.empowerchain.io/" target="_blank" class="logo">
        <img
          src="https://uploads-ssl.webflow.com/6313299a553f4107e9ec5a4f/6313424c3c13ed46c6d5f429_white2.png"
          loading="lazy"
          alt=""
        />
      </a>

      <ul class="navLinks">
        <li><NuxtLink to="/nftwrapper">NFT Wrapper</NuxtLink></li>
        <li><NuxtLink to="/tokenswapper">Token Swapper</NuxtLink></li>
        <li><NuxtLink to="/faq">FAQ</NuxtLink></li>
      </ul>
      <div class="walletBox">
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
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
}

.topBox {
  margin-top: 30px;
  width: 80vw;
  display: flex;
  align-items: center;

  background-color: black;
  box-sizing: border-box;
}

.logo {
  width: 25%;
}

.logo img {
  width: 100%;
}

.navLinks {
  display: flex;
  flex-direction: row;
  list-style: none;
  gap: 30px;
  justify-content: center;
  margin: 0;
  padding: 0;
  width: 50%;
}

.navLinks li a {
  text-decoration: none;
  color: rgba(255, 255, 255, 0.664);
  font-size: 25px;
}

.navLinks li a:hover {
  color: white;
}

.walletBox {
  text-align: center;
  width: 25%;
  padding: 0 10px; /* Add padding to prevent text from touching the edges */
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
  cursor: pointer;
  font-size: 15px;
  width: 150px;
  height: 30px;
}

.walletButton:hover {
  background-color: rgb(2, 43, 12);
  color: white;
}
</style>
