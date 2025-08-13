// src/pages/UploadTransferPage.js
import React, { useState, useRef,useContext } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authApis, endpoints } from '../configs/Apis';
import { MyInvoiceContext } from '../configs/Contexts';
const UploadTransferPage = () => {
  const navigate = useNavigate();
 const [invoice,dispatch] = useContext(MyInvoiceContext);

  const image = useRef();
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) return;

    const formData = new FormData();
    console.info("invoice", invoice);
    formData.append("invoiceId", invoice?.id || 0);
    formData.append("method", "Ủy nhiệm chi");

    if (image.current?.files.length > 0) {
      formData.append("image", image.current.files[0]);
    }
    console.info("Submitting form data:", formData);

    try {
      const res = await authApis().post(endpoints['updateImageBill'], formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("Upload file:", file);

      if (res.status === 200) {
        setSuccess(true);
        navigate("/invoices");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Đã xảy ra lỗi khi tải lên ủy nhiệm chi. Vui lòng thử lại.");
    }
  };

  return (
    <Container className="mt-4">
      <h3>Tải lên ủy nhiệm chi</h3>

      {invoice && (
        <p>
          <strong>Hóa đơn:</strong> {invoice.name} - {invoice.total.toLocaleString()} VND
        </p>
      )}

      {success && (
        <Alert variant="success">
          Đã gửi ảnh ủy nhiệm chi thành công!
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Ảnh chụp bill</Form.Label>
          <div>
            <img width={300} src={previewImage || "https://via.placeholder.com/150"} alt="Preview" />
          </div>
          <Form.Control type="file" ref={image} onChange={handleImageChange} />
        </Form.Group>

        <Button type="submit" variant="primary">Gửi</Button>
      </Form>
    </Container>
  );
};

export default UploadTransferPage;
