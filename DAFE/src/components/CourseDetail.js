import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { authApis, endpoints } from "../configs/Apis";
import { Badge, Button, Card, Col, Container, Row, Table } from "react-bootstrap";
import CourseReview from "./CourseReview";

const CourseDetail = () => {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [enrollments, setEnrollments] = useState([]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await authApis().get(endpoints.courseDetail(id));
            if (res.data?.success) {
                setCourse(res.data.data.course);
                console.log("Course from API:", res.data.data.course);

                setClasses(res.data.data.classes || []);
            }
        } finally {
            setLoading(false);
        }
    };
     const loadEnrollments = async () => {
            try {
                const res = await authApis().get(endpoints.myEnrollments);
                if (res.data?.success) setEnrollments(res.data.data || []);
                console.log("Enrollments from API:", res.data.data || []);
            } catch (e) {
                setMessage("Vui lòng đăng nhập để xem lớp học của bạn");
            }
        };

    useEffect(() => {
        fetchDetail();
        loadEnrollments();
        console.log("CourseID:", course);
        console.log("Enrollments:", enrollments);
    }, [id]);

    const addToCart = async (classId) => {
        try {
            const res = await authApis().post(endpoints.cart, { class_id: classId, quantity: 1 });
            if (res.data?.success) setMessage("Đã thêm vào giỏ hàng");
        } catch (e) {
            setMessage("Vui lòng đăng nhập để thêm vào giỏ hàng");
        }
    };

    const enrollNow = async (classId) => {
        try {
            await authApis().post(endpoints.cart, { class_id: classId, quantity: 1 });
            await authApis().post(endpoints.placeOrder);
            setMessage("Đăng ký thành công");
        } catch (e) {
            setMessage("Thanh toán thất bại hoặc cần đăng nhập");
        }
    };

    if (!course) return <Container className="mt-3">Đang tải...</Container>;

    return (
        <Container className="mt-3">
            <Row className="g-3">
                <Col md={8}>
                    <h3>{course.title}</h3>
                    <div className="mb-2">
                        <Badge bg="info" className="me-2">{course.level || ""}</Badge>
                        <Badge bg="secondary">{course.language || ""}</Badge>
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: course.description }} />

                </Col>
                <Col md={4}>
                    <Card>
                        {course.thumbnail && (
                            <Card.Img variant="top" src={course.thumbnail} alt={course.title} />
                        )}
                        <Card.Body>
                            {course.discountPercentage ? (
                                <>
                                    <span className="text-decoration-line-through me-2">{course.price?.toLocaleString()} đ</span>
                                    <strong>{Math.round((course.price || 0) * (1 - course.discountPercentage / 100)).toLocaleString()} đ</strong>
                                </>
                            ) : (
                                <strong>{(course.price || 0).toLocaleString()} đ</strong>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <h4 className="mt-4">Chọn lớp và khung giờ</h4>
            {message && <div className="alert alert-info py-2 my-2">{message}</div>}
            <Table hover responsive>
                <thead>
                    <tr>
                        <th>Lớp</th>
                        <th>Lịch học</th>
                        <th>Ngày bắt đầu</th>
                        <th>Trạng thái</th>
                        <th>Học phí</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                   {classes.map((c) => {
                    const isEnrolled = enrollments.some(e => e.class_id?._id === c._id);

                    return (
                    <tr key={c._id}>
                        <td>{c.class_name}</td>
                        <td>
                        {(c.schedule || []).map((s, idx) => (
                            <div key={idx}>{`Thứ ${s.day_of_week + 1} ${s.start_time}-${s.end_time}`}</div>
                        ))}
                        </td>
                        <td>{c.start_date ? new Date(c.start_date).toLocaleDateString() : ""}</td>
                        <td>{c.status}</td>
                        <td>
                        {c.discountPercentage ? (
                            <>
                            <span className="text-decoration-line-through me-2">
                                {c.price?.toLocaleString()} đ
                            </span>
                            <strong>
                                {Math.round((c.price || 0) * (1 - c.discountPercentage / 100)).toLocaleString()} đ
                            </strong>
                            </>
                        ) : (
                            <strong>{(c.price || 0).toLocaleString()} đ</strong>
                        )}
                        </td>
                        <td className="text-nowrap">
                        {isEnrolled ? (
                            <Badge bg="success">Đã đăng ký</Badge>
                        ) : (
                            <Button
                            size="sm"
                            className="me-2"
                            variant="outline-primary"
                            onClick={() => addToCart(c._id)}
                            >
                            Thêm giỏ hàng
                            </Button>
                        )}
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </Table>

            {/* Đánh giá & bình luận */}
            <CourseReview courseId={course._id} user={null} />
        </Container>
    );
};

export default CourseDetail;
