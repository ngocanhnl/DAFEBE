import { useState } from "react";
import { Button, Form, Alert } from "react-bootstrap";
import Apis, { endpoints } from "../configs/Apis";

const Register = () => {
    const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "" });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        try {
            setLoading(true);
            await Apis.post(endpoints.register, form);
            setMessage("Đăng ký thành công, vui lòng kiểm tra email để xác thực.");
        } catch (ex) {
            setError(ex.response?.data?.message || ex.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1 className="text-center text-success mt-2">ĐĂNG KÝ</h1>
            {message && <Alert variant="success">{message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={submit}>
                <Form.Group className="mb-3" controlId="fullName">
                    <Form.Label>Họ tên</Form.Label>
                    <Form.Control value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} type="text" placeholder="Họ tên" required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="Email" required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="password">
                    <Form.Label>Mật khẩu</Form.Label>
                    <Form.Control value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" placeholder="Mật khẩu" required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="phone">
                    <Form.Label>Số điện thoại (tùy chọn)</Form.Label>
                    <Form.Control value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} type="tel" placeholder="Số điện thoại" />
                </Form.Group>
                <Button type="submit" variant="success" disabled={loading}>{loading ? "Đang xử lý..." : "Đăng ký"}</Button>
            </Form>
        </>
    );
};

export default Register;


