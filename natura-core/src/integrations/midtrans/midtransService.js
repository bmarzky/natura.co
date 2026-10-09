const midtransClient = require('midtrans-client');

const coreApi = new midtransClient.CoreApi({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY'
});

const snapApi = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY'
});

async function createSnapTransaction(orderId, amount, customerDetails) {
    let parameter = {
        "transaction_details": {
            "order_id": orderId,
            "gross_amount": amount
        },
        "customer_details": customerDetails
    };

    try {
        const transaction = await snapApi.createTransaction(parameter);
        return transaction.redirect_url; // Returns the payment link
    } catch (e) {
        console.error('Midtrans Snap Error:', e.message);
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
    createSnapTransaction,
    getTransactionStatus,
    coreApi
};
