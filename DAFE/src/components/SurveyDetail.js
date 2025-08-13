import React, { useEffect, useState } from "react";
import { Container, Form, Button, Alert, Spinner, Row, Col } from "react-bootstrap";
import { useParams } from "react-router-dom";
import axios from "axios";
import { authApis, endpoints } from "../configs/Apis";

const SurveyDetail = () => {
  const { id } = useParams(); 
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await authApis().get(endpoints["survey"]+`/${id}`);
        setQuestions(res.data);
      } catch (err) {
        console.error("Lỗi khi tải câu hỏi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [id]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: parseInt(value) });
    console.log(`Câu hỏi ${questionId} đã chọn đáp án: ${value}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Đáp án đã chọn:", answers);
    try {
        const res = await authApis().post(endpoints["answerSurvey"], answers);
        console.log("Kết quả gửi thành công:", res.status);
      } catch (err) {
        console.error("Lỗi :", err);
      } finally {
        setLoading(false);
      }

    setSubmitted(true);
  };

  if (loading) return <Spinner animation="border" />;

  return (
    <Container className="mt-5">
      <h3 className="mb-4">Khảo sát #{id}</h3>

      {submitted && <Alert variant="success">Cảm ơn bạn đã hoàn thành khảo sát!</Alert>}

      {!submitted && (
        <Form onSubmit={handleSubmit}>
          {questions.map((q, idx) => (
            <Form.Group key={q.id} className="mb-4">
              <Form.Label><strong>{idx + 1}. {q.content}</strong></Form.Label>
              <Row>
                {[...Array(10)].map((_, i) => (
                  <Col key={i + 1} xs="1" className="text-center">
                    <Form.Check
                      type="radio"
                      name={`q_${q.id}`}
                      value={i + 1}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      label={i + 1}
                      checked={answers[q.id] === i + 1}
                    />
                  </Col>
                ))}
              </Row>
            </Form.Group>
          ))}

          <div className="text-end">
            <Button type="submit" variant="primary">Gửi khảo sát</Button>
          </div>
        </Form>
      )}
    </Container>
  );
};

export default SurveyDetail;
