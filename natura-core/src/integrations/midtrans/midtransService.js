const midtransClient = require('midtrans-client');

const coreApi = new midtransClient.CoreApi({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY'
});

async function chargeTransaction(orderId, amount, customerDetails, paymentMethod) {
    let parameter = {
        "payment_type": "bank_transfer",
        "transaction_details": {
            "order_id": orderId,
            "gross_amount": amount
        },
        "customer_details": customerDetails
    };

    const method = paymentMethod.toLowerCase();

    if (method === 'bca' || method === 'bni' || method === 'bri') {
        parameter.payment_type = "bank_transfer";
        parameter.bank_transfer = {
            "bank": method
        };
    } else if (method === 'mandiri') {
        parameter.payment_type = "echannel";
        parameter.echannel = {
            "bill_info1": "Payment:",
            "bill_info2": "Online purchase"
        };
    } else if (method === 'qris') {
        parameter.payment_type = "qris";
    } else if (method === 'gopay') {
        parameter.payment_type = "gopay";
    } else {
        // Default fallback to BCA
        parameter.payment_type = "bank_transfer";
        parameter.bank_transfer = {
            "bank": "bca"
        };
    }

    try {
        const transaction = await coreApi.charge(parameter);
        return transaction; // Returns full Midtrans API response containing VA numbers etc.
    } catch (e) {
        console.error('Midtrans Charge Error:', e.message);
        throw e;
    }
}

async function getTransactionStatus(orderId) {
    try {
        const status = await coreApi.transaction.status(orderId);
        return status;
    } catch (e) {
        if (e.message && e.message.includes('404')) {
            return { transaction_status: 'not_found' };
        }
        console.error('Midtrans Status Error:', e.message);
        throw e;
    }
}

module.exports = {
    chargeTransaction,
    getTransactionStatus,
    coreApi
};
