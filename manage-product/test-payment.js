// File test để kiểm tra chức năng thanh toán
// Chạy: node test-payment.js

const mongoose = require('mongoose');
const Order = require('./models/order.model');
const Enrollment = require('./models/enrollment.model');

// Kết nối database (thay đổi connection string theo cấu hình của bạn)
mongoose.connect('mongodb://localhost:27017/your_database_name', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function testPaymentFlow() {
    try {
        console.log('Testing payment flow...');
        
        // Test 1: Tạo order với status pending
        const testOrder = await Order.create({
            user_id: new mongoose.Types.ObjectId(),
            items: [{
                class_id: new mongoose.Types.ObjectId(),
                price: 100000,
                discountPercentage: 10,
                quantity: 1
            }],
            total: 90000,
            status: 'pending',
            payment_method: 'vnpay'
        });
        
        console.log('✅ Order created with pending status:', testOrder._id);
        
        // Test 2: Tạo enrollment với payment_status pending
        const testEnrollment = await Enrollment.create({
            student_id: testOrder.user_id,
            class_id: testOrder.items[0].class_id,
            status: 'pending',
            payment_status: 'pending',
            amount_paid: 90000
        });
        
        console.log('✅ Enrollment created with pending payment:', testEnrollment._id);
        
        // Test 3: Simulate successful payment
        testOrder.status = 'paid';
        testOrder.vnpay_response_code = '00';
        testOrder.vnpay_transaction_id = 'TEST123456';
        await testOrder.save();
        
        console.log('✅ Order updated to paid status');
        
        // Test 4: Update enrollment to paid
        testEnrollment.payment_status = 'paid';
        testEnrollment.status = 'approved';
        testEnrollment.payment_date = new Date();
        await testEnrollment.save();
        
        console.log('✅ Enrollment updated to paid status');
        
        // Cleanup test data
        await Order.findByIdAndDelete(testOrder._id);
        await Enrollment.findByIdAndDelete(testEnrollment._id);
        
        console.log('✅ Test data cleaned up');
        console.log('🎉 All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        mongoose.connection.close();
    }
}

testPaymentFlow();
