import React, { useState } from "react";
import { Container, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import { authApis, endpoints } from "../configs/Apis";


const VehicleCard = () => {
  const [relativeName, setRelativeName] = useState("");
  const [relativePhone, setRelativePhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [variant, setVariant] = useState("success");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!relativeName || !relativePhone) {
      setVariant("danger");
      setMessage("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (!/^\d{10,11}$/.test(relativePhone)) {
      setVariant("danger");
      setMessage("Số điện thoại không hợp lệ (phải từ 10-11 chữ số).");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);


      const response = await authApis().post(endpoints["getCardList"], {
        relativeName,
        relativePhone,
      });

      setVariant("success");
      setMessage("Đăng ký thành công!");
    } catch (error) {
      setVariant("danger");
      setMessage("Đã xảy ra lỗi khi đăng ký.");
      console.error("Error during registration:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container style={{ maxWidth: "600px", marginTop: "50px" }}>
      <h3 className="mb-4">Đăng ký thẻ xe</h3>

      {message && <Alert variant={variant}>{message}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group as={Row} className="mb-3" controlId="relativeName">
          <Form.Label column sm={4}>Tên người thân</Form.Label>
          <Col sm={8}>
            <Form.Control
              type="text"
              value={relativeName}
              onChange={(e) => setRelativeName(e.target.value)}
              placeholder="Nhập tên người thân"
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="relativePhone">
          <Form.Label column sm={4}>SĐT người thân</Form.Label>
          <Col sm={8}>
            <Form.Control
              type="tel"
              value={relativePhone}
              onChange={(e) => setRelativePhone(e.target.value)}
              placeholder="Nhập số điện thoại"
            />
          </Col>
        </Form.Group>

        <div className="text-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" animation="border" /> : "Đăng ký"}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default VehicleCard;
