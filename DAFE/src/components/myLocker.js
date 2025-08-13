import React, { useContext, useEffect, useState } from 'react';
import { Container, Table } from 'react-bootstrap';
import { MyUserContext } from '../configs/Contexts';
import { authApis, endpoints } from '../configs/Apis';

const MyLocker = () => {
    const [user] = useContext(MyUserContext);
    const [items, setItems] = useState([]);

    useEffect(() => {
        const loadLockerItems = async () => {
            try {
                let res = await authApis().get(endpoints['my-locker']); 
                console.log("Locker items:", res.data);
                setItems(res.data);
            } catch (err) {
                console.error("Lỗi tải dữ liệu:", err);
            }
        };

        loadLockerItems();
    }, []);

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleString('vi-VN'); // Hoặc dùng toLocaleDateString() nếu chỉ cần ngày
    };

    return (
        <Container className="mt-5">
            <h3>Tủ đồ của tôi</h3>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Ảnh</th>
                        <th>Tên món hàng</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        <th>Ngày nhận</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx}>
                            <td>
                                <img
                                    src={item.image || "https://via.placeholder.com/100"}
                                    width="80"
                                    alt={item.itemName}
                                />
                            </td>
                            <td>{item.itemName}</td>
                            <td>{item.status}</td>
                            <td>{formatDate(item.createdAt)}</td>
                            <td>{formatDate(item.receivedAt)}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
};

export default MyLocker;
