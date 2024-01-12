<template>
    <div>
        <WalletConnection />
        <Faq />
    </div>
</template>

<script>
// Import your components
import WalletConnection from "~/components/walletConnection.vue";
import Faq from "~/components/faq.vue";

export default {
  name: "FaqPage",
  components: {
    // Register your components for use in the template
    WalletConnection,
    Faq,
  },
};
</script>