const Order = require("../../models/order.model");
const Cart = require("../../models/cart.model");
const ClassModel = require("../../models/class.model");
const Enrollment = require("../../models/enrollment.model");
// const { sortObject } = require("../../helper/checkout");




async function buildOrderFromCart(cart) {
    const items = [];
    let total = 0;
    for (const item of cart.courses) {
        const classDoc = await ClassModel.findById(item.course_id);
        if (!classDoc) continue;
        const price = classDoc.price || 0;
        const discount = classDoc.discountPercentage || 0;
        const finalPrice = Math.round(price * (1 - discount / 100));
        const qty = item.quantity || 1;
        total += finalPrice * qty;
        items.push({ class_id: classDoc._id, price, discountPercentage: discount, quantity: qty });
    }
    return { items, total };
}

module.exports.preview = async (req, res) => {
    try {
        const userId = req.userClient._id.toString();
        const cart = await Cart.findOne({ user_id: userId });
        if (!cart || cart.courses.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }
        const summary = await buildOrderFromCart(cart);
        return res.json({ success: true, data: summary });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to preview order", error: error.message });
    }
};


const vnp_TmnCode = 'VH92V83I';
const vnp_HashSecret = 'FI8DNHRRIWNQ3WB4RVMJ4ZTYKQGTLMJG';
const vnp_Url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const vnp_ReturnUrl = 'http://localhost:3000/payment-result';


const moment = require("moment");
const qs = require("qs");
const crypto = require("crypto");



function sortObject(obj) {
    const sorted = {};
    Object.keys(obj)
      .filter(k => obj[k] !== undefined && obj[k] !== null && obj[k] !== '')
      .sort()
      .forEach(k => (sorted[k] = obj[k]));
    return sorted;
  }
  
  function buildHashData(params) {
    // Không đưa các field hash vào chuỗi ký
    const p = { ...params };
    delete p.vnp_SecureHash;
    delete p.vnp_SecureHashType;
  
    // Quan trọng: encode theo RFC1738 (space -> "+") để khớp PHP urlencode
    return qs.stringify(sortObject(p), { encode: true, format: 'RFC1738' });
  }
  
  module.exports.placeOrder = async (req, res) => {
    try {
      const user = req.userClient;
      const cart = await Cart.findOne({ user_id: user._id.toString() });
      if (!cart || cart.courses.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
      }
  
      const { items, total } = await buildOrderFromCart(cart);
  
      const orderDoc = await Order.create({
        user_id: user._id,
        items,
        total,
        status: "pending",
        payment_method: "vnpay",
        createdAt: new Date(),
      });
  
      // ======== VNPAY =========
      const now = moment();
      const txnRef = now.format("YYYYMMDDHHmmss");
      const createDate = now.format("YYYYMMDDHHmmss");
      const expireDate = now.clone().add(15, "minutes").format("YYYYMMDDHHmmss");
  
      // Luôn dùng total từ server
      const amountVnd = Math.round(Number(total) || 0); // VNĐ
      const vnpAmount = amountVnd * 100; // đơn vị xu
  
      const vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: vnp_TmnCode,              // từ cấu hình Sandbox của bạn
        vnp_Amount: vnpAmount,                 // integer
        vnp_CurrCode: "VND",
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: `Thanh toan don hang ${txnRef}`, // không dấu, tránh ký tự đặc biệt
        vnp_OrderType: "other",
        vnp_Locale: "vn",
        vnp_ReturnUrl: vnp_ReturnUrl,          // URL đã đăng ký ở portal
        vnp_IpAddr: req.ip || req.headers['x-forwarded-for'] || "127.0.0.1",
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,            // khuyến nghị: thêm hạn giao dịch
        // vnp_BankCode: req.body.bankCode || undefined, // nếu cần cố định bank
      };
  
      // build hashData theo chuẩn 2.1.0: urlencode(key)=urlencode(value), space -> '+'
      const hashData = buildHashData(vnp_Params);
  
      const secureHash = crypto
        .createHmac("sha512", vnp_HashSecret) // đúng thuật toán
        .update(hashData, "utf-8")
        .digest("hex");
  
      // KHÔNG gửi vnp_SecureHashType ở 2.1.0
      const query = qs.stringify(sortObject(vnp_Params), {
        encode: true,
        format: "RFC1738",
      });
  
      const paymentUrl = `${vnp_Url}?${query}&vnp_SecureHash=${secureHash}`;
  
      // ===== DEBUG =====
      console.log("DEBUG ---- VNPay Build ----");
      console.log("amount (VND):", amountVnd);
      console.log("vnp_Amount (x100):", vnpAmount);
      console.log("hashData:", hashData); // đã RFC1738 encode (space -> '+')
      console.log("secureHash:", secureHash);
      console.log("paymentUrl:", paymentUrl);
      console.log("--------------------------");
  
      // Lưu txnRef để đối chiếu ở ReturnURL/IPN
      orderDoc.vnp_TxnRef = txnRef;

    //   create enrollment pending
    const enrollmentPromises = items.map((it) =>
        Enrollment.create({
            student_id: user._id,
            class_id: it.class_id,
            status: "pending",
            payment_status: "pending",
            amount_paid:
                Math.round(it.price * (1 - (it.discountPercentage || 0) / 100)) *
                (it.quantity || 1)
        })
    );
    
    const enrollments = await Promise.all(enrollmentPromises);

        orderDoc.enrollmentList = enrollments.map(enrollment => ({
            enrollment_id: enrollment._id
        }));


      await orderDoc.save();

  
      return res.json({
        success: true,
        message: "Order created successfully, redirecting to payment",
        data: {
          order_id: orderDoc._id,
          payment_url: paymentUrl
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to place order",
        error: error.message
      });
    }
  };




// Thêm function mới để xử lý vnpay-return
// module.exports.vnpayReturn = async (req, res) => {
//     try {
//         const { vnp_ResponseCode, vnp_TxnRef, vnp_Amount, vnp_SecureHash, vnp_TransactionNo } = req.query;
        
//         console.log("VNPay return params:", req.query); // Log để debug
        
//         // Kiểm tra response code từ VNPay
//         if (vnp_ResponseCode === '00') {
//             // Thanh toán thành công
//             const txnRef = vnp_TxnRef;
            
//             // Tìm order bằng txnRef
//             const order = await Order.findOne({ vnp_TxnRef: txnRef });
//             if (!order) {
//                 console.log("Order not found for txnRef:", txnRef);
//                 return res.status(404).json({ 
//                     success: false, 
//                     message: "Order not found" 
//                 });
//             }

//             // Cập nhật trạng thái order và thông tin VNPay
//             order.status = "paid";
//             order.vnpay_response_code = vnp_ResponseCode;
//             order.vnpay_transaction_id = vnp_TransactionNo;
//             order.vnpay_secure_hash = vnp_SecureHash;
//             order.updatedAt = new Date();
//             await order.save();

//             // Cập nhật tất cả enrollment liên quan thành paid
//             const enrollments = await Enrollment.find({
//                 student_id: order.user_id,
//                 class_id: { $in: order.items.map(item => item.class_id) }
//             });

//             const updatePromises = enrollments.map(enrollment => {
//                 enrollment.payment_status = "paid";
//                 enrollment.status = "approved"; // Chuyển từ pending sang approved
//                 enrollment.payment_date = new Date();
//                 return enrollment.save();
//             });

//             await Promise.all(updatePromises);

//             // Clear cart sau khi thanh toán thành công
//             const cart = await Cart.findOne({ user_id: order.user_id.toString() });
//             if (cart) {
//                 cart.courses = [];
//                 await cart.save();
//             }

//             return res.json({
//                 success: true,
//                 status: "success",
//                 message: "Payment successful! Your enrollment has been confirmed."
//             });
//         } else {
//             // Thanh toán thất bại
//             const txnRef = vnp_TxnRef;
            
//             // Tìm order bằng txnRef
//             const order = await Order.findOne({ vnp_TxnRef: txnRef });
//             if (order) {
//                 order.status = "failed";
//                 order.vnpay_response_code = vnp_ResponseCode;
//                 order.updatedAt = new Date();
//                 await order.save();
//             }

//             // Xóa các enrollment pending (rollback)
//             if (order) {
//                 await Enrollment.deleteMany({
//                     student_id: order.user_id,
//                     class_id: { $in: order.items.map(item => item.class_id) },
//                     payment_status: "pending"
//                 });
//             }

//             return res.json({
//                 success: false,
//                 status: "error",
//                 message: "Payment failed. Please try again."
//             });
//         }
//     } catch (error) {
//         console.error("VNPay return error:", error);
//         return res.status(500).json({
//             success: false,
//             status: "error",
//             message: "An error occurred while processing payment result."
//         });
//     }
// };
module.exports.vnpayReturn = async (req, res) => {
    try {
        const { vnp_ResponseCode, vnp_TxnRef, vnp_SecureHash, vnp_TransactionNo } = req.query;

        console.log("VNPay return params:", req.query);

        // TODO: Verify chữ ký vnp_SecureHash trước khi xử lý (quan trọng)
        // if (!isValidSignature(req.query, vnp_SecureHash)) { ... }

        const order = await Order.findOne({ vnp_TxnRef });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (vnp_ResponseCode === '00') {
            // ✅ Thanh toán thành công
            order.status = "paid";
            order.vnpay_response_code = vnp_ResponseCode;
            order.vnpay_transaction_id = vnp_TransactionNo;
            order.vnpay_secure_hash = vnp_SecureHash;
            order.updatedAt = new Date();
            await order.save();

            // ✅ Update enrollment sang paid
            if (order.enrollmentList?.length > 0) {
                const enrollmentIds = order.enrollmentList.map(e => e.enrollment_id);
                await Enrollment.updateMany(
                    { _id: { $in: enrollmentIds } },
                    {
                        $set: {
                            payment_status: "paid",
                            status: "approved",
                            payment_date: new Date()
                        }
                    }
                );
            }

            // ✅ Xóa giỏ hàng
            await Cart.findOneAndUpdate(
                { user_id: order.user_id.toString() },
                { $set: { courses: [] } }
            );

            return res.json({
                success: true,
                status: "success",
                message: "Payment successful! Your enrollment has been confirmed."
            });
        } else {
            // ❌ Thanh toán thất bại
            order.status = "failed";
            order.vnpay_response_code = vnp_ResponseCode;
            order.updatedAt = new Date();
            await order.save();

            // ❌ Xóa các enrollment pending
            if (order.enrollmentList?.length > 0) {
                const enrollmentIds = order.enrollmentList.map(e => e.enrollment_id);
                await Enrollment.deleteMany({
                    _id: { $in: enrollmentIds },
                    payment_status: "pending"
                });
            }

            return res.json({
                success: false,
                status: "error",
                message: "Payment failed. Please try again."
            });
        }
    } catch (error) {
        console.error("VNPay return error:", error);
        return res.status(500).json({
            success: false,
            status: "error",
            message: "An error occurred while processing payment result."
        });
    }
};
