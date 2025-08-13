import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Spinner, Alert, Container } from 'react-bootstrap';

const PaymentResultPage = () => {
  const { search } = useLocation(); // lấy chuỗi ?vnp_...
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchPaymentResult = async () => {
      try {
        // Nếu bạn dùng cookie để lưu token thì không cần header này
        // Nếu dùng Bearer token thì cần thêm header Authorization
        const res = await axios.get(`http://localhost:8080/ApartManagement/api/vnpay-return${search}`, {
          withCredentials: true, // nếu dùng cookie chứa token
          // headers: { Authorization: `Bearer ${token}` }, // nếu dùng Bearer token
        });

        setStatus(res.data.status);
        setMessage(res.data.message);
      } catch (err) {
        setStatus('error');
        setMessage('Không thể xác minh kết quả thanh toán.');
      }
    };

    fetchPaymentResult();
  }, [search]);

  return (
    <Container className="mt-5">
      {status === 'loading' && <Spinner animation="border" />}
      {status !== 'loading' && (
        <Alert variant={status === 'success' ? 'success' : 'danger'}>
          {message}
        </Alert>
      )}
    </Container>
  );
};

export default PaymentResultPage;
