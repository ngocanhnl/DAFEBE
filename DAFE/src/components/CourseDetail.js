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

    useEffect(() => {
        fetchDetail();
        console.log("CourseID:", course);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    <p>{course.description}</p>
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
                    {classes.map((c) => (
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
                                        <span className="text-decoration-line-through me-2">{c.price?.toLocaleString()} đ</span>
                                        <strong>{Math.round((c.price || 0) * (1 - c.discountPercentage / 100)).toLocaleString()} đ</strong>
                                    </>
                                ) : (
                                    <strong>{(c.price || 0).toLocaleString()} đ</strong>
                                )}
                            </td>
                            <td className="text-nowrap">
                                <Button size="sm" className="me-2" variant="outline-primary" onClick={() => addToCart(c._id)}>Thêm giỏ hàng</Button>
                                <Button size="sm" variant="primary" onClick={() => enrollNow(c._id)}>Đăng ký</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Đánh giá & bình luận */}
            <CourseReview courseId={course._id} user={null} />
        </Container>
    );
};

export default CourseDetail;
// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { authApis, endpoints } from "../configs/Apis";
// import { Badge, Button, Card, Col, Container, Row } from "react-bootstrap";
// import CourseReview from "./CourseReview";

// const CourseDetail = () => {
//   const { id } = useParams();
//   const [course, setCourse] = useState(null);
//   const [classes, setClasses] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");

//   const fetchDetail = async () => {
//     setLoading(true);
//     try {
//       const res = await authApis().get(endpoints.courseDetail(id));
//       if (res.data?.success) {
//         setCourse(res.data.data.course);
//         setClasses(res.data.data.classes || []);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDetail();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [id]);

//   const enrollNow = async (classId) => {
//     try {
//       await authApis().post(endpoints.cart, { class_id: classId, quantity: 1 });
//       await authApis().post(endpoints.placeOrder);
//       setMessage("Đăng ký thành công");
//     } catch (e) {
//       setMessage("Thanh toán thất bại hoặc cần đăng nhập");
//     }
//   };

//   if (!course) return <Container className="mt-3">Đang tải...</Container>;

//   return (
//     <Container className="mt-4">
//       <Row>
//         {/* Left content */}
//         <Col md={8}>
//           {course.thumbnail && (
//             <img
//               src={course.thumbnail}
//               alt={course.title}
//               className="img-fluid rounded mb-3"
//             />
//           )}

//           <h3 className="fw-bold">{course.title}</h3>
//           <div className="mb-2">
//             <Badge bg="info" className="me-2">
//               {course.level || ""}
//             </Badge>
//             <Badge bg="secondary">{course.language || ""}</Badge>
//           </div>

//           {/* Mô tả ngắn */}
//           <p>{course.description}</p>

//           {/* About this course */}
//           <h5 className="mt-4">About this course</h5>
//           <p>{course.about || "Thông tin đang cập nhật..."}</p>

//           {/* What you’ll learn */}
//           <h5 className="mt-4">What you'll learn</h5>
//           <ul>
//             {(course.learning_outcomes || []).map((item, idx) => (
//               <li key={idx}>{item}</li>
//             ))}
//           </ul>

//           {/* Classes */}
//           <h5 className="mt-4">Chọn lớp và khung giờ</h5>
//           {message && (
//             <div className="alert alert-info py-2 my-2">{message}</div>
//           )}
//           {classes.map((c) => (
//             <Card className="mb-3" key={c._id}>
//               <Card.Body>
//                 <h6>{c.class_name}</h6>
//                 <div className="text-muted small mb-2">
//                   {(c.schedule || []).map((s, idx) => (
//                     <div key={idx}>
//                       Thứ {s.day_of_week + 1} {s.start_time} - {s.end_time}
//                     </div>
//                   ))}
//                   {c.start_date && (
//                     <div>Bắt đầu: {new Date(c.start_date).toLocaleDateString()}</div>
//                   )}
//                 </div>

//                 <div className="d-flex justify-content-between align-items-center">
//                   <strong>
//                     {c.discountPercentage ? (
//                       <>
//                         <span className="text-decoration-line-through me-2">
//                           {c.price?.toLocaleString()} đ
//                         </span>
//                         {Math.round(
//                           (c.price || 0) * (1 - c.discountPercentage / 100)
//                         ).toLocaleString()}{" "}
//                         đ
//                       </>
//                     ) : (
//                       (c.price || 0).toLocaleString() + " đ"
//                     )}
//                   </strong>
//                   <Button size="sm" onClick={() => enrollNow(c._id)}>
//                     Enroll Now
//                   </Button>
//                 </div>
//               </Card.Body>
//             </Card>
//           ))}

//           {/* Reviews */}
//           <CourseReview courseId={course._id} user={null} />
//         </Col>

//         {/* Right sidebar */}
//         <Col md={4}>
//           <Card className="shadow-sm">
//             <Card.Body className="text-center">
//               <h5 className="mb-3">Thông tin khóa học</h5>
//               <p>
//                 <strong>
//                   {course.discountPercentage ? (
//                     <>
//                       <span className="text-decoration-line-through me-2">
//                         {course.price?.toLocaleString()} đ
//                       </span>
//                       {Math.round(
//                         (course.price || 0) *
//                           (1 - course.discountPercentage / 100)
//                       ).toLocaleString()}{" "}
//                       đ
//                     </>
//                   ) : (
//                     (course.price || 0).toLocaleString() + " đ"
//                   )}
//                 </strong>
//               </p>

//               <Button
//                 variant="success"
//                 className="w-100 mb-3"
//                 onClick={() =>
//                   classes.length > 0 && enrollNow(classes[0]._id)
//                 }
//               >
//                 Enroll
//               </Button>

//               <ul className="list-unstyled text-start small">
//                 <li>👨‍🎓 {course.students_count || "0"} học viên</li>
//                 <li>⏳ {course.duration || "Tùy chọn"}</li>
//                 <li>📅 {course.weeks || "Không xác định"} tuần</li>
//                 <li>⭐ Trình độ: {course.level}</li>
//                 <li>🌐 Ngôn ngữ: {course.language}</li>
//               </ul>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>
//     </Container>
//   );
// };

// export default CourseDetail;
