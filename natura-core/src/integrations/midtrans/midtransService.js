const midtransClient = require('midtrans-client');

const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY';
const clientKey = process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY';
const isProd = serverKey.startsWith('Mid-server');

const coreApi = new midtransClient.CoreApi({
    isProduction: isProd,
    serverKey: serverKey,
    clientKey: clientKey
});

const snapApi = new midtransClient.Snap({
    isProduction: isProd,
    serverKey: serverKey,
    clientKey: clientKey
});

async function createCoreTransaction(orderId, amount, customerDetails, paymentMethod) {
    let parameter = {
        "payment_type": "bank_transfer",
        "transaction_details": {
            "order_id": orderId,
            "gross_amount": amount
        },
        "customer_details": customerDetails
    };

    const method = (paymentMethod || '').toLowerCase();

    if (method.includes('bsi') || method.includes('bca') || method.includes('bni') || method.includes('bri')) {
        parameter.payment_type = "bank_transfer";
        // Convert to valid Midtrans bank code
        let bankCode = "bca";
        if (method.includes('bsi')) bankCode = "bsi";
        if (method.includes('bni')) bankCode = "bni";
        if (method.includes('bri')) bankCode = "bri";
        
        parameter.bank_transfer = { "bank": bankCode };
    } else if (method.includes('mandiri')) {
        parameter.payment_type = "echannel";
        parameter.echannel = { "bill_info1": "Payment:", "bill_info2": "Online purchase" };
    } else if (method.includes('gopay')) {
        parameter.payment_type = "gopay";
    } else if (method.includes('qris')) {
        parameter.payment_type = "qris";
    } else {
        // Fallback to BCA VA
        parameter.payment_type = "bank_transfer";
        parameter.bank_transfer = { "bank": "bca" };
    }

    try {
        const transaction = await coreApi.charge(parameter);
        return transaction; 
    } catch (e) {
        console.error('Midtrans Core Error:', e.message);
        throw e;
    }
}

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
        return transaction.redirect_url; 
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
    createCoreTransaction,
    createSnapTransaction,
    getTransactionStatus,
    coreApi
};
