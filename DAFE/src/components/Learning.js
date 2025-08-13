import { useEffect, useState } from "react";
import { authApis, endpoints } from "../configs/Apis";
import { Accordion, Badge, Button, Card, Container } from "react-bootstrap";

const Learning = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [message, setMessage] = useState("");

    const loadEnrollments = async () => {
        try {
            const res = await authApis().get(endpoints.myEnrollments);
            if (res.data?.success) setEnrollments(res.data.data || []);
        } catch (e) {
            setMessage("Vui lòng đăng nhập để xem lớp học của bạn");
        }
    };

    const openClass = async (classId) => {
        try {
            const res = await authApis().get(endpoints.classDetail(classId));
            if (res.data?.success) setSelectedClass(res.data.data);
        } catch {}
    };

    useEffect(() => {
        loadEnrollments();
    }, []);

    return (
        <Container className="mt-3">
            <h3>Khóa học của tôi</h3>
            {message && <div className="alert alert-info py-2 my-2">{message}</div>}
            <div className="d-flex gap-3 flex-wrap">
                {enrollments.map((en) => (
                    <Card key={en._id} style={{ width: 320 }}>
                        <Card.Body>
                            <Card.Title>{en.class_id?.class_name}</Card.Title>
                            <Card.Text>
                                <Badge bg="success" className="me-2">{en.status}</Badge>
                                <small>Bắt đầu: {en.class_id?.start_date ? new Date(en.class_id.start_date).toLocaleDateString() : ""}</small>
                            </Card.Text>
                            <Button size="sm" onClick={() => openClass(en.class_id?._id)}>Xem bài học</Button>
                        </Card.Body>
                    </Card>
                ))}
            </div>

            {selectedClass && (
                <div className="mt-4">
                    <h4>{selectedClass.class_name}</h4>
                    <Accordion defaultActiveKey="0">
                        {(selectedClass.lessons || []).map((ls, idx) => (
                            <Accordion.Item eventKey={String(idx)} key={idx}>
                                <Accordion.Header>{ls.lesson_name}</Accordion.Header>
                                <Accordion.Body>
                                    {ls.video_url ? (
                                        <div className="ratio ratio-16x9 mb-3">
                                            <iframe src={ls.video_url} title={ls.lesson_name} allowFullScreen />
                                        </div>
                                    ) : null}
                                    <div dangerouslySetInnerHTML={{ __html: ls.content || "" }} />
                                </Accordion.Body>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </div>
            )}
        </Container>
    );
};

export default Learning;


