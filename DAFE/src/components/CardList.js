import React, { useEffect, useState } from "react";
import { Container, Table, Badge, Spinner, Alert, Button } from "react-bootstrap";
import { authApis, endpoints } from "../configs/Apis";
import { useNavigate } from "react-router-dom";

const CardList = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await authApis().get(endpoints['getCardList']);
        setCards(res.data);
      } catch (err) {
        setError("Không thể tải danh sách thẻ.");
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  return (
    <Container style={{ marginTop: "50px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Danh sách thẻ xe</h3>
        <Button variant="primary" onClick={() => navigate("/vehicle-card-add")}>
          + Tạo mới
        </Button>
      </div>

      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên người thân</th>
              <th>Số điện thoại</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center">
                  Chưa có thẻ nào được đăng ký.
                </td>
              </tr>
            ) : (
              cards.map((card, index) => (
                <tr key={card.id || index}>
                  <td>{index + 1}</td>
                  <td>{card.relativeName}</td>
                  <td>{card.relativePhone}</td>
                  <td>
                    {card.status == "approved" ? (
                      <Badge bg="success">Đã duyệt</Badge>
                    ) : (
                      <Badge bg="secondary">Chưa duyệt</Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default CardList;
