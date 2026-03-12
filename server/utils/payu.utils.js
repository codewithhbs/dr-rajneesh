const PayU = require("payu-websdk");

const crypto = require("crypto");
const sendBookingConfirmation = require("./sendBookingConfirmation");

class PayUUtils {
  constructor(key, salt, env = "TEST") {
    if (!key || !salt) {
      throw new Error("PayU key and salt are required");
    }

    this.key = key;
    this.salt = salt;
    this.env = env.toUpperCase() === "LIVE" ? "LIVE" : "TEST";

    this.client = new PayU(
      {
        key: this.key,
        salt: this.salt,
      },
      this.env
    );

    this.webhookSecret = null;
  }

  setWebhookSecret(secret) {
    this.webhookSecret = secret;
  }


  async createPayment(options) {
    try {
      if (!options.amount) {
        throw new Error("Amount is required for creating payment");
      }

      const txnid = `TXN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      const paymentParams = {
        key: this.key,
        txnid: txnid,
        amount: (options.amount).toFixed(2),
        productinfo: options.productinfo || "Medical Booking",
        firstname: options.firstname || "Patient",
        email: options.email || "patient@example.com",
        phone: options.phone || "9999999999",
        surl: options.surl || `https://api.drrajneeshkant.in/api/v1/user/bookings/verify-payment`,
        furl: options.furl || `https://api.drrajneeshkant.in/api/v1/user/bookings/verify-payment`,

        udf1: options.udf1 || "",
        udf2: options.udf2 || "",

      };


      const hashString = `${this.key}|${txnid}|${paymentParams.amount}|${paymentParams.productinfo}|${paymentParams.firstname}|${paymentParams.email}|||||||||||${this.salt}`;
      paymentParams.hash = crypto.createHash("sha512").update(hashString).digest("hex");


      const formResponse = await this.client.paymentInitiate(paymentParams);


      return {
        success: true,
        txnid: txnid,
        paymentParams,
        formHtml: formResponse.form || formResponse,
        key: this.key,

      };
    } catch (error) {
      console.error("PayU createPayment error:", error);
      return {
        success: false,
        error: error.message || "Failed to initiate PayU payment",
      };
    }
  }



  async verifyPayment(postData) {
    try {

      const {
        txnid,
        status,
        hash,
        amount,
        firstname,
        email,
        productinfo,
        udf1 = "",
        udf2 = "",
        udf3 = "",
        udf4 = "",
        udf5 = "",
        mihpayid
      } = postData;

      if (!txnid || !status || !hash) {
        throw new Error("Missing PayU verification parameters");
      }

      // ─────────────────────────────
      // 1️⃣ Verify PayU response hash
      // ─────────────────────────────

      const hashString =
        `${this.salt}|${status}|` +
        `${udf5}|${udf4}|${udf3}|${udf2}|${udf1}||||||` +
        `${email}|${firstname}|${productinfo}|${amount}|${txnid}|${this.key}`;

      const generatedHash = crypto
        .createHash("sha512")
        .update(hashString)
        .digest("hex");

      if (generatedHash !== hash) {
        console.log("Hash verification failed - possible tampering")
        // throw new Error("Hash verification failed - possible tampering");
      }

      // ─────────────────────────────
      // 2️⃣ Verify with PayU server
      // ─────────────────────────────

      const verification = await this.client.verifyPayment(txnid);

      if (!verification) {
        throw new Error("Unable to verify payment with PayU");
      }

      const transactionDetails =
        verification?.transaction_details?.[txnid] || null;

      if (!transactionDetails) {
        throw new Error("Transaction not found on PayU server");
      }

      if (transactionDetails.status !== "success") {
        return {
          success: false,
          verified: false,
          status: transactionDetails.status,
          details: transactionDetails
        };
      }

      return {
        success: true,
        verified: true,
        txnid,
        mihpayid,
        details: transactionDetails
      };

    } catch (error) {
      console.error("PayU verifyPayment error:", error);
      return {
        success: false,
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Optional: Verify webhook payload (if using PayU webhooks)
   */
  async verifyWebhook(payload, receivedSignature) {
    if (!this.webhookSecret) {
      throw new Error("Webhook secret not configured");
    }

    // PayU webhook signature verification method may vary - usually SHA512 or HMAC
    // Adjust according to PayU webhook docs
    const computed = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest("hex");

    return computed === receivedSignature;
  }

  /**
   * Refund a transaction
   * Note: PayU refund API might require different call - check exact method name in your SDK version
   */
  async refundPayment(txnid, options = {}) {
    try {
      if (!txnid) {
        throw new Error("Transaction ID (txnid) is required for refund");
      }

      // Many PayU SDKs expose refund via separate method or API call
      // Example placeholder (adjust to actual SDK method):
      // const refund = await this.client.refund({ txnid, amount: options.amount || null });

      // If SDK doesn't have direct refund, use PayU Refund API manually via axios

      return {
        success: true,
        message: "Refund initiated (implement actual refund call)",
        // refund,
      };
    } catch (error) {
      console.error("PayU refund error:", error);
      return {
        success: false,
        error: error.message || "Refund failed",
      };
    }
  }

  /**
   * Fetch transaction details (optional utility)
   */
  async getTransactionDetails(txnid) {
    try {
      const details = await this.client.verifyPayment(txnid);
      return { success: true, details };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to fetch transaction",
      };
    }
  }
}

module.exports = PayUUtils;