import { useState } from "react";
import { Button, Form, Alert } from "react-bootstrap";
import Apis, { endpoints } from "../configs/Apis";
import { useNavigate } from "react-router-dom";
import MySpinner from "./layout/MySpinner";

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: send email, 2: verify otp, 3: reset password
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const nav = useNavigate();

    const sendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const res = await Apis.post(endpoints['sendOtp'], { email: form.email });
            if (res.data && res.data.success) {
                setStep(2);
            } else {
                setMsg(res.data.message || "Lỗi gửi OTP");
            }
        } catch (ex) {
            setMsg(ex.response?.data?.message || ex.message || "Lỗi gửi OTP");
        } finally { setLoading(false); }
    }

    const verify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const res = await Apis.post(endpoints['checkOtp'] || '/check-otp', { email: form.email, otp: form.otp });
            if (res.data && res.data.success) {
                setStep(3);
            } else {
                setMsg(res.data.message || "OTP không hợp lệ");
            }
        } catch (ex) {
            setMsg(ex.response?.data?.message || ex.message || "Lỗi xác thực OTP");
        } finally { setLoading(false); }
    }

    const reset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const res = await Apis.post(endpoints['resetPassword'] || '/reset-password', { email: form.email, otp: form.otp, password: form.password });
            if (res.data && res.data.success) {
                nav('/login');
            } else {
                setMsg(res.data.message || "Lỗi đổi mật khẩu");
            }
        } catch (ex) {
            setMsg(ex.response?.data?.message || ex.message || "Lỗi đổi mật khẩu");
        } finally { setLoading(false); }
    }

    return (
        <div>
            <h3>Quên mật khẩu</h3>
            {msg && <Alert variant="danger">{msg}</Alert>}

            {step === 1 && <Form onSubmit={sendOtp}>
                <Form.Group className="mb-3">
                    <Form.Label>Email đã đăng ký</Form.Label>
                    <Form.Control required type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
                </Form.Group>
                {loading ? <MySpinner/> : <Button type="submit">Gửi mã OTP</Button>}
            </Form>}

            {step === 2 && <Form onSubmit={verify}>
                <Form.Group className="mb-3">
                    <Form.Label>OTP</Form.Label>
                    <Form.Control required type="text" value={form.otp || ''} onChange={e => setForm({...form, otp: e.target.value})} />
                </Form.Group>
                {loading ? <MySpinner/> : <Button type="submit">Xác thực OTP</Button>}
            </Form>}

            {step === 3 && <Form onSubmit={reset}>
                <Form.Group className="mb-3">
                    <Form.Label>Mật khẩu mới</Form.Label>
                    <Form.Control required type="password" value={form.password || ''} onChange={e => setForm({...form, password: e.target.value})} />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Xác nhận mật khẩu</Form.Label>
                    <Form.Control required type="password" value={form.confirm || ''} onChange={e => setForm({...form, confirm: e.target.value})} />
                </Form.Group>
                {form.password !== form.confirm && <div className="text-danger mb-2">Mật khẩu không khớp</div>}
                {loading ? <MySpinner/> : <Button type="submit" disabled={form.password !== form.confirm}>Đặt lại mật khẩu</Button>}
            </Form>}
        </div>
    );
}

export default ForgotPassword;
