// File test để kiểm tra việc tạo chữ ký VNPay
// Chạy: node test-vnpay-signature.js

const crypto = require('crypto');
const qs = require('qs');
const moment = require('moment');

// Thông tin VNPay test
const vnp_TmnCode = 'VH92V83I';
const vnp_HashSecret = 'FI8DNHRRIWNQ3WB4RVMJ4ZTYKQGTLMJG';
const vnp_Url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const vnp_ReturnUrl = 'http://localhost:3000/payment-result';

function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (let key of keys) {
        sorted[key] = obj[key];
    }
    return sorted;
}

function testVNPaySignature() {
    console.log('Testing VNPay signature generation...\n');
    
    // Tạo tham số test
    const momentNow = moment();
    const txnRef = momentNow.format("YYYYMMDDHHmmss");
    const createDate = momentNow.format("YYYYMMDDHHmmss");
    const amount = 100000; // 100,000 VND
    
    let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: vnp_TmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: `Thanh_toan_don_hang_${txnRef}`,
        vnp_OrderType: "other",
        vnp_Amount: amount * 100, // Nhân 100
        vnp_ReturnUrl: vnp_ReturnUrl,
        vnp_IpAddr: "127.0.0.1",
        vnp_CreateDate: createDate
    };
    
    console.log('Original params:');
    console.log(JSON.stringify(vnp_Params, null, 2));
    console.log('\n---\n');
    
    // Sắp xếp theo alphabet
    vnp_Params = sortObject(vnp_Params);
    
    console.log('Sorted params:');
    console.log(JSON.stringify(vnp_Params, null, 2));
    console.log('\n---\n');
    
    // Tạo chuỗi dữ liệu
    const signData = qs.stringify(vnp_Params, { encode: false });
    console.log('Sign data string:');
    console.log(signData);
    console.log('\n---\n');
    
    // Tạo chữ ký
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const secureHash = hmac.update(signData).digest("hex");
    
    console.log('Secure hash:');
    console.log(secureHash);
    console.log('\n---\n');
    
    // Thêm chữ ký vào params
    vnp_Params["vnp_SecureHash"] = secureHash;
    
    // Tạo URL thanh toán
    const paymentUrl = `${vnp_Url}?${qs.stringify(vnp_Params, { encode: false })}`;
    
    console.log('Final payment URL:');
    console.log(paymentUrl);
    console.log('\n---\n');
    
    // Test với dữ liệu mẫu từ VNPay
    console.log('Testing with VNPay sample data...\n');
    
    const sampleParams = {
        vnp_Amount: '450000000',
        vnp_Command: 'pay',
        vnp_CreateDate: '20250817152506',
        vnp_CurrCode: 'VND',
        vnp_IpAddr: '127.0.0.1',
        vnp_Locale: 'vn',
        vnp_OrderInfo: 'Thanh_toan_don_hang_20250817152506',
        vnp_OrderType: 'other',
        vnp_ReturnUrl: 'http://localhost:3000/payment-result',
        vnp_TmnCode: 'VH92V83I',
        vnp_TxnRef: '20250817152506',
        vnp_Version: '2.1.0',
    };
    
    const sortedSample = sortObject(sampleParams);
    const sampleSignData = qs.stringify(sortedSample, { encode: false });
    const sampleHmac = crypto.createHmac('sha512', vnp_HashSecret);
    const sampleHash = sampleHmac.update(sampleSignData).digest('hex');
    
    console.log('Sample sign data:', sampleSignData);
    console.log('Sample hash:', sampleHash);
    
    return {
        txnRef,
        secureHash,
        paymentUrl,
        signData
    };
}

// Chạy test
const result = testVNPaySignature();
console.log('\n🎯 Test completed!');
console.log('TxnRef:', result.txnRef);
console.log('Hash length:', result.secureHash.length);
console.log('URL length:', result.paymentUrl.length);
