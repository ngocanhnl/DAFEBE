function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (let key of keys) {
      sorted[key] = obj[key];
    }
    return sorted;
  }

  function buildVnpayUrl({ 
    amount, txnRef, ipAddr, returnUrl, secretKey, tmnCode 
}) {
    const date = new Date();
    const createDate = date.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

    let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Amount: amount * 100, // nhân 100
        vnp_CurrCode: "VND",
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: `Thanh toan don hang ${txnRef}`,
        vnp_OrderType: "other",
        vnp_Locale: "vn",
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate
    };

    // Hàm encode chuẩn VNPay
    function encodeVnpParams(params) {
        let sortedKeys = Object.keys(params).sort();
        let query = sortedKeys.map(key => {
            return key + "=" + encodeURIComponent(params[key]).replace(/%20/g, "+");
        });
        return query.join("&");
    }

    // Build signData
    const signData = encodeVnpParams(vnp_Params);

    // Tạo secure hash
    const secureHash = crypto.createHmac("sha512", secretKey)
        .update(signData, "utf8")
        .digest("hex");

    // Append vnp_SecureHash vào URL
    const paymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${signData}&vnp_SecureHash=${secureHash}`;

    return { paymentUrl, secureHash, signData, vnp_Params };
}


  module.exports = {
    sortObject,
    buildVnpayUrl
  }