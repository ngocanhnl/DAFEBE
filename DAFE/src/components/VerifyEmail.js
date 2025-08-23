import { useEffect, useState } from "react";
import { Alert, Button } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import Apis, { endpoints } from "../configs/Apis";

const VerifyEmail = () => {
    const [q] = useSearchParams();
    const [status, setStatus] = useState("pending");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const token = q.get("token");
        const run = async () => {
            try {
                setStatus("loading");
                await Apis.get(endpoints.verifyEmail(token));
                setStatus("success");
                setMessage("Xác thực email thành công. Bạn sẽ được chuyển đến trang đăng nhập...");
                setTimeout(() => { window.location.href = "/login"; }, 1500);
            } catch (ex) {
                setStatus("error");
                setMessage(ex.response?.data?.message || ex.message);
            }
        };
        if (token) run();
    }, [q]);

    return (
        <>
            <h1 className="text-center text-success mt-2">Xác thực email</h1>
            {status === "loading" && <Alert variant="info">Đang xác thực...</Alert>}
            {message && <Alert variant={status === "success" ? "success" : "danger"}>{message}</Alert>}
            <Button href="/login" variant="primary">Đến trang đăng nhập</Button>
        </>
    );
};

export default VerifyEmail;


