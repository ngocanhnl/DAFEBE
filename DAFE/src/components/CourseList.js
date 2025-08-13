import { useEffect, useState } from "react";
import { Button, Card, Col, Container, Form, Row, Badge } from "react-bootstrap";
import Apis, { endpoints } from "../configs/Apis";
import { Link } from "react-router-dom";

const CourseList = () => {
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const fetchCourses = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const params = { page: pageNumber, limit: 12 };
            if (keyword) params.keyword = keyword;
            if (categoryId) params.category_id = categoryId;
            const res = await Apis.get(endpoints.courses, { params });
            if (res.data && res.data.success) {
                setCourses(res.data.data || []);
                const pg = res.data.pagination || { totalPages: 1, page: 1 };
                setTotalPages(pg.totalPages || 1);
                setPage(pg.page || 1);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const run = async () => {
            const res = await Apis.get(endpoints.categories);
            setCategories(res.data?.data || []);
        };
        run();
        fetchCourses(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSearch = (e) => {
        e.preventDefault();
        fetchCourses(1);
    };

    const nextPage = () => {
        if (page < totalPages) fetchCourses(page + 1);
    };
    const prevPage = () => {
        if (page > 1) fetchCourses(page - 1);
    };

    return (
        <Container className="mt-3">
            <h2 className="mb-3">Khóa học ngoại ngữ</h2>
            <Form onSubmit={onSearch} className="mb-3">
                <Row className="g-2">
                    <Col md={6}>
                        <Form.Control value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm theo tên khóa học" />
                    </Col>
                    <Col md={3}>
                        <Form.Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                            <option value="">Tất cả chủ đề</option>
                            {categories.map((c) => (
                                <option key={c._id} value={c._id}>{c.title}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col md={3}>
                        <Button type="submit" variant="primary" disabled={loading}>Tìm kiếm</Button>
                    </Col>
                </Row>
            </Form>

            <Row className="g-3">
                {courses.map((course) => (
                    <Col key={course._id} md={4}>
                        <Card className="h-100">
                            {course.thumbnail && (
                                <Card.Img variant="top" src={course.thumbnail} alt={course.title} />
                            )}
                            <Card.Body className="d-flex flex-column">
                                <Card.Title>{course.title}</Card.Title>
                                <Card.Text className="flex-grow-1">
                                    <small className="text-muted">Cấp độ: {course.level || "N/A"}</small><br />
                                    <small className="text-muted">Ngôn ngữ: {course.language || "N/A"}</small>
                                </Card.Text>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        {course.discountPercentage ? (
                                            <>
                                                <Badge bg="danger" className="me-2">-{course.discountPercentage}%</Badge>
                                                <span className="text-decoration-line-through me-2">{course.price?.toLocaleString()} đ</span>
                                                <strong>{Math.round((course.price || 0) * (1 - course.discountPercentage / 100)).toLocaleString()} đ</strong>
                                            </>
                                        ) : (
                                            <strong>{(course.price || 0).toLocaleString()} đ</strong>
                                        )}
                                    </div>
                                    <Button as={Link} to={`/courses/${course.slug || course._id}`} variant="outline-primary" size="sm">Xem chi tiết</Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
                <Button variant="secondary" onClick={prevPage} disabled={page <= 1 || loading}>Trang trước</Button>
                <span>Trang {page}/{totalPages}</span>
                <Button variant="secondary" onClick={nextPage} disabled={page >= totalPages || loading}>Trang sau</Button>
            </div>
        </Container>
    );
};

export default CourseList;


