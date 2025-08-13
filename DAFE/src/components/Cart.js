import { useEffect, useState } from "react";
import { authApis, endpoints } from "../configs/Apis";
import { Button, Container, Table } from "react-bootstrap";

const Cart = () => {
    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState(null);
    const [message, setMessage] = useState("");

    const loadCart = async () => {
        try {
            const res = await authApis().get(endpoints.cart);
            if (res.data?.success) setItems(res.data.data.items || []);
        } catch {}
    };

    const preview = async () => {
        try {
            const res = await authApis().get(endpoints.checkoutPreview);
            if (res.data?.success) setSummary(res.data.data);
        } catch {}
    };

    const removeItem = async (classId) => {
        await authApis().delete(`${endpoints.cart}/${classId}`);
        loadCart();
        preview();
    };

    const placeOrder = async () => {
        try {
            const res = await authApis().post(endpoints.placeOrder);
            if (res.data?.success) {
                setMessage("Thanh toán thành công");
                await loadCart();
                await preview();
            }
        } catch (e) {
            setMessage("Thanh toán thất bại");
        }
    };

    useEffect(() => {
        loadCart();
        preview();
    }, []);

    return (
        <Container className="mt-3">
            <h3>Giỏ hàng</h3>
            {message && <div className="alert alert-info py-2 my-2">{message}</div>}
            <Table hover responsive>
                <thead>
                    <tr>
                        <th>Lớp</th>
                        <th>Bắt đầu</th>
                        <th>Trạng thái</th>
                        <th>Số lượng</th>
                        <th>Giá</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((it) => (
                        <tr key={it.class_id}>
                            <td>{it.class_name}</td>
                            <td>{it.start_date ? new Date(it.start_date).toLocaleDateString() : ""}</td>
                            <td>{it.status}</td>
                            <td>{it.quantity}</td>
                            <td>
                                {it.discountPercentage ? (
                                    <>
                                        <span className="text-decoration-line-through me-2">{it.price?.toLocaleString()} đ</span>
                                        <strong>{Math.round((it.price || 0) * (1 - it.discountPercentage / 100)).toLocaleString()} đ</strong>
                                    </>
                                ) : (
                                    <strong>{(it.price || 0).toLocaleString()} đ</strong>
                                )}
                            </td>
                            <td>
                                <Button size="sm" variant="outline-danger" onClick={() => removeItem(it.class_id)}>Xóa</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <div className="d-flex justify-content-end align-items-center gap-3">
                <div>
                    <div>Tổng tiền: <strong>{summary ? (summary.total || 0).toLocaleString() : 0} đ</strong></div>
                </div>
                <Button onClick={placeOrder} disabled={!items.length}>
                    Thanh toán
                </Button>
            </div>
        </Container>
    );
};

export default Cart;


