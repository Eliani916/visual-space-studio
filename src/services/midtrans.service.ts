import midtransClient from "midtrans-client";

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

export const snap = new midtransClient.Snap({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
});

export const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
});

export async function createTransaction(orderId: string, grossAmount: number, customerDetails: any, itemDetails: any) {
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(grossAmount),
    },
    customer_details: customerDetails,
    item_details: itemDetails,
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return transaction;
  } catch (error: any) {
    console.error("Midtrans createTransaction error:", error.message);
    throw new Error("Gagal membuat transaksi Midtrans");
  }
}
