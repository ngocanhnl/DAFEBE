import { useEffect, useState, useContext } from "react";
import { Card, Button, Form, Alert } from "react-bootstrap";
import axios from "axios";
import cookie from 'react-cookies'
import { MyUserContext } from "../configs/Contexts";
export default function CourseReview({ courseId, user }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [user2, dispatch] = useContext(MyUserContext);
  const token = cookie.load('token');

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line
  }, [courseId]);

  async function fetchReviews() {
    try {
      const res = await axios.get(
      `http://localhost:4000/api/review/course/${courseId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`, // nếu có token
          "Content-Type": "application/json",
          "X-Custom-Header": "customValue"
        }
      }
    );
      setReviews(res.data.data || []);
    } catch (err) {
      setReviews([]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    console.log("User", user2)
    try {
      const res = await axios.post("http://localhost:4000/api/review", {
        course_id: courseId,
        rating,
        comment,
        student_id: user2?._id // fallback nếu chưa có xác thực token
      }, {
    headers: {
      Authorization: `Bearer ${token}`, // nếu có token
      "Content-Type": "application/json",
      "X-Custom-Header": "customValue"
    }
  });
      if (res.data.success) {
        setSuccess("Đã gửi đánh giá thành công!");
        setSubmitted(true);
        fetchReviews();
      } else {
        setError(res.data.error || "Có lỗi xảy ra");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Có lỗi khi gửi đánh giá");
    }
    setLoading(false);
  }

  // Kiểm tra đã đánh giá chưa
  const hasReviewed = reviews.some(r => r.student_id === user?._id);

  return (
    <Card className="my-4">
      <Card.Header>Đánh giá & Bình luận khóa học</Card.Header>
      <Card.Body>
        {success && <Alert variant="success">{success}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        {!hasReviewed && !submitted && (
          <Form onSubmit={handleSubmit} className="mb-4">
            <Form.Group className="mb-2">
              <Form.Label>Chọn số sao đánh giá</Form.Label>
              <Form.Select value={rating} onChange={e => setRating(Number(e.target.value))}>
                {[5,4,3,2,1].map(star => (
                  <option key={star} value={star}>{star} sao</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Bình luận</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
                required
                placeholder="Nhập nhận xét về khóa học..."
              />
            </Form.Group>
            <Button type="submit" disabled={loading}>Gửi đánh giá</Button>
          </Form>
        )}
        <h6 className="mb-3">Các đánh giá gần đây</h6>
        {reviews.length === 0 && <div>Chưa có đánh giá nào.</div>}
        {reviews.map((r, i) => (
          <div key={i} className="mb-3 p-2 border rounded bg-light">
            <div><b>{r.student_id.fullName || "Người dùng đã xóa"}</b> - <span className="text-warning">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</span></div>
            <div>{r.comment}</div>
            <div className="small text-muted">{new Date(r.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </Card.Body>
    </Card>
  );
}
