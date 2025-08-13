import React, { useEffect, useState } from "react";
import { Container, Table, Spinner, Alert } from "react-bootstrap";
import { authApis, endpoints } from "../configs/Apis";
import { Link } from "react-router-dom";


const SurveyList = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const res = await authApis().get(endpoints["survey"]); 
        setSurveys(res.data);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách khảo sát.");
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, []);

  return (
    <Container className="mt-5">
      <h3 className="mb-4">Danh sách khảo sát</h3>

      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Tiêu đề</th>
              <th>Mô tả</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {surveys.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center">
                  Không có khảo sát nào.
                </td>
              </tr>
            ) : (
              surveys.map((survey, index) => (
                <tr key={survey.id}>
                  <td>{index + 1}</td>
                  <td>{survey.title}</td>
                  <td>{survey.description}</td>
                  <td>
                    <Link to={`/survey-detail/${survey.id}`} className="nav-link text-info">
                                               xem
                    </Link>
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

export default SurveyList;
