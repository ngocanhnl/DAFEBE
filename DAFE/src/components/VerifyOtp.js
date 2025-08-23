import { useState } from "react";
import { Button, Form, Alert } from "react-bootstrap";
import Apis, { endpoints } from "../configs/Apis";

const VerifyOtp = () => {
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const send = async () => {
        setMessage("");
        setError("");
        try {
            setLoading(true);
            await Apis.post(endpoints.sendOtp, { email: email || undefined, phone: phone || undefined });
            setMessage("Đã gửi OTP. Vui lòng kiểm tra.");
        } catch (ex) {
            setError(ex.response?.data?.message || ex.message);
        } finally {
            setLoading(false);
        }
    };

    const verify = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        try {
            setLoading(true);
            await Apis.post(endpoints.verifyOtp, { email: email || undefined, phone: phone || undefined, otp });
            setMessage("Xác thực OTP thành công. Bạn có thể đăng nhập.");
        } catch (ex) {
            setError(ex.response?.data?.message || ex.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1 className="text-center text-success mt-2">Xác thực qua OTP</h1>
            {message && <Alert variant="success">{message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={verify}>
                <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Email (hoặc để trống nếu dùng số điện thoại)</Form.Label>
                    <Form.Control value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" />
                </Form.Group>
                <Form.Group className="mb-3" controlId="phone">
                    <Form.Label>Số điện thoại (hoặc để trống nếu dùng email)</Form.Label>
                    <Form.Control value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="Số điện thoại" />
                </Form.Group>
                <div className="mb-3">
                    <Button type="button" variant="secondary" onClick={send} disabled={loading}>
                        {loading ? "Đang gửi..." : "Gửi OTP"}
                    </Button>
                </div>
                <Form.Group className="mb-3" controlId="otp">
                    <Form.Label>Nhập OTP</Form.Label>
                    <Form.Control value={otp} onChange={e => setOtp(e.target.value)} type="text" placeholder="Mã OTP" required />
                </Form.Group>
                <Button type="submit" variant="success" disabled={loading}>
                    {loading ? "Đang xác thực..." : "Xác thực"}
                </Button>
            </Form>
        </>
    );
};

export default VerifyOtp;


