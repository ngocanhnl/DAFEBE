import React, { useEffect, useState, useContext } from 'react';
import { Table, Button, Container, Spinner, Modal, Form } from 'react-bootstrap';
import { MyInvoiceContext } from "../configs/Contexts";
import Apis, { authApis, endpoints, VNpayApis } from '../configs/Apis';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const InvoicePage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [invoice, dispatch] = useContext(MyInvoiceContext);
    const navigate = useNavigate();
  const loadInvoices = async () => {
    try {
      const res = await authApis().get(endpoints['invoiceList']);
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handlePayment = (invoice) => {
    setSelectedInvoice(invoice);
    dispatch({ type: 'selectInvoice', payload: invoice });
    setPaymentMethod('');  
    setShowModal(true);
  };

  const handleConfirmPayment = async() => {
    if (!paymentMethod) {
      alert("Vui lòng chọn phương thức thanh toán!");
      return;
    }

    if(paymentMethod === "Ủy nhiệm chi") {

      navigate('/uyNhiem');
    } else {
   
      try {
            const response = await axios.get(`http://localhost:8080/ApartManagement/api/create-payment`, {
              params: {
                amount: invoice.total,
                invoiceId: invoice.id
              }
            });
            console.info("Response từ backend:", response.data);
      
            const paymentUrl = response.data.paymentUrl;
      
            if (paymentUrl) {
              window.location.href = paymentUrl; // chuyển hướng sang VNPAY
            } else {
              alert('Không thể tạo URL thanh toán.');
            }
          } catch (error) {
            console.error('Lỗi khi tạo thanh toán:', error);
            alert('Đã xảy ra lỗi khi kết nối đến máy chủ.');
          }
    }

    setShowModal(false);
  };

  if (loading) return <Spinner animation="border" />;

  return (
    <Container className="mt-4">
      <h2 className="text-center text-success mb-4">Danh sách hóa đơn</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên hóa đơn</th>
            <th>Số tiền</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, idx) => (
            <tr key={idx}>
                <td>{inv.id}</td>
              <td>{inv.name}</td>
              <td>{inv.total.toLocaleString()} VND</td>
              <td>{inv.status}</td>
              <td>
                {inv.status === "Chưa thanh toán" ? (
                  <Button variant="primary" onClick={() => handlePayment(inv)}>
                    Thanh toán
                  </Button>
                ) : (
                  <span className="text-success">✔</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal chọn phương thức thanh toán */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
            <Modal.Title>Thanh toán hóa đơn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p>Bạn muốn thanh toán hóa đơn <strong>{selectedInvoice?.name}</strong>?</p>
            <p>Số tiền: <strong>{selectedInvoice?.total.toLocaleString()} VND</strong></p>

            {/* Dropdown chọn phương thức thanh toán */}
            <Form.Group className="mb-3">
                <Form.Label>Chọn phương thức thanh toán</Form.Label>
                <Form.Select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                >
                    <option value="">-- Chọn phương thức --</option>
                    <option value="Chuyển khoản">Chuyển khoản</option>
                    <option value="Ủy nhiệm chi">Ủy nhiệm chi</option>
     
                </Form.Select>
            </Form.Group>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button variant="success" onClick={handleConfirmPayment}>Xác nhận thanh toán</Button>
        </Modal.Footer>
    </Modal>
    </Container>
  );
};

export default InvoicePage;
