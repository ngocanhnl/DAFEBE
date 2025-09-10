import { useEffect, useState } from "react";
import { authApis, endpoints } from "../configs/Apis";
import { Accordion, Badge, Button, Card, Container, Row, Col, Alert, Modal } from "react-bootstrap";
import RealtimeChat from "./chat/RealtimeChat";
import LivestreamViewer from "./chat/LivestreamViewer";
import ClassTransfer from "./ClassTransfer";


const getRandomBg = () => {
  const colors = [
    "linear-gradient(135deg, #42a5f5, #478ed1)",
    "linear-gradient(135deg, #66bb6a, #43a047)",
    "linear-gradient(135deg, #ffa726, #fb8c00)",
    "linear-gradient(135deg, #ab47bc, #8e24aa)",
    "linear-gradient(135deg, #ef5350, #e53935)",
    "linear-gradient(135deg, #26c6da, #00acc1)",
    "linear-gradient(135deg, #7e57c2, #5e35b1)"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};


const Learning = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [message, setMessage] = useState("");
    const [livestreams, setLivestreams] = useState([]);
    const [activeLivestreams, setActiveLivestreams] = useState([]);
    const [fullscreenLivestream, setFullscreenLivestream] = useState(null);

    const loadEnrollments = async () => {
        try {
            const res = await authApis().get(endpoints.myEnrollments);
            if (res.data?.success) setEnrollments(res.data.data || []);
        } catch (e) {
            setMessage("Vui lòng đăng nhập để xem lớp học của bạn");
        }
    };

    const loadLivestreams = async () => {
        try {
            const res = await authApis().get(endpoints.myLivestreams);
            if (res.data?.success) setLivestreams(res.data.data || []);
        } catch (e) {
            console.error("Error loading livestreams:", e);
        }
    };

    const loadActiveLivestreams = async () => {
        try {
            const res = await authApis().get(endpoints.activeLivestreams);
            if (res.data?.success) setActiveLivestreams(res.data.data || []);
        } catch (e) {
            console.error("Error loading active livestreams:", e);
        }
    };

    const debugLivestream = async () => {
        try {
            const res = await authApis().get(endpoints.debugLivestream);
            console.log("🔍 Debug response:", res.data);
            if (res.data?.success) {
                console.table(res.data.debug.enrollmentStatuses);
                console.table(res.data.debug.classesWithLivestream);
            }
        } catch (e) {
            console.error("Error debug livestream:", e);
        }
    };

    const openClass = async (classId) => {
        try {
            const res = await authApis().get(endpoints.classDetail(classId));
            if (res.data?.success) setSelectedClass(res.data.data);
        } catch {}
    };

    // Hàm chuyển đổi URL video sang dạng embed
    const getEmbedUrl = (url) => {
        if (!url) return "";

        // YouTube
        const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
        const ytMatch = url.match(ytRegex);
        if (ytMatch && ytMatch[1]) {
            return `https://www.youtube.com/embed/${ytMatch[1]}`;
        }

        // Vimeo
        const vimeoRegex = /vimeo\.com\/(\d+)/;
        const vimeoMatch = url.match(vimeoRegex);
        if (vimeoMatch && vimeoMatch[1]) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }

        // Giữ nguyên nếu không match
        return url;
    };

    // Callback khi chuyển lớp thành công
    const handleTransferComplete = () => {
        loadEnrollments(); // Reload danh sách enrollment
    };

    useEffect(() => {
        loadEnrollments();
        loadLivestreams();
        loadActiveLivestreams();
        debugLivestream(); // Chạy debug khi component load
        
        // Auto refresh active livestreams every 30 seconds
        const interval = setInterval(loadActiveLivestreams, 30000);
        return () => clearInterval(interval);
    }, []);

    // return (
    //     <Container className="mt-3">
    //         <div className="d-flex justify-content-between align-items-center mb-3">
    //             <h3>Khóa học của tôi</h3>
    //             <Button variant="outline-info" size="sm" onClick={debugLivestream}>
    //                 🔍 Debug Livestream
    //             </Button>
    //         </div>
    //         {message && <div className="alert alert-info py-2 my-2">{message}</div>}
            
    //         {/* Active Livestreams */}
    //         {activeLivestreams.length > 0 && (
    //             <div className="mb-4">
    //                 <h4 className="text-danger">
    //                     <i className="fas fa-broadcast-tower me-2"></i>
    //                     Livestream đang hoạt động
    //                 </h4>
    //                 <Row>
    //                     {activeLivestreams.map((item) => (
    //                         <Col md={8} lg={6} key={item.class_id} className="mb-3">
    //                             <Card className="border-danger">
    //                                 <Card.Body>
    //                                     <Card.Title className="text-danger">
    //                                         <i className="fas fa-circle text-danger me-2"></i>
    //                                         {item.class_name}
    //                                     </Card.Title>
    //                                     <Card.Text>
    //                                         <small className="text-muted">
    //                                             {item.course_title} - {item.instructor_name}
    //                                         </small>
    //                                     </Card.Text>
    //                                     <div className="ratio ratio-16x9 mb-3">
    //                                         <iframe
    //                                             src={item.livestream.embedUrl}
    //                                             title={item.livestream.title}
    //                                             allowFullScreen
    //                                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    //                                             style={{ border: 'none' }}
    //                                         />
    //                                     </div>
    //                                     <div className="d-flex gap-2">
    //                                         <Button 
    //                                             size="sm" 
    //                                             variant="primary"
    //                                             onClick={() => setFullscreenLivestream(item)}
    //                                         >
    //                                             <i className="fas fa-expand me-1"></i>
    //                                             Xem toàn màn hình
    //                                         </Button>
    //                                         <Button 
    //                                             size="sm" 
    //                                             variant="outline-primary"
    //                                             onClick={() => openClass(item.class_id)}
    //                                         >
    //                                             Vào lớp học
    //                                         </Button>
    //                                         <Button 
    //                                             size="sm" 
    //                                             variant="outline-secondary"
    //                                             onClick={() => window.open(item.livestream.youtubeUrl, '_blank')}
    //                                         >
    //                                             <i className="fab fa-youtube me-1"></i>
    //                                             Mở YouTube
    //                                         </Button>
    //                                     </div>
    //                                 </Card.Body>
    //                             </Card>
    //                         </Col>
    //                     ))}
    //                 </Row>
    //             </div>
    //         )}

    //         {/* All Livestreams */}
    //         {livestreams.length > 0 && (
    //             <div className="mb-4">
    //                 <h4>
    //                     <i className="fas fa-video me-2"></i>
    //                     Tất cả livestream
    //                 </h4>
    //                 <Row>
    //                     {livestreams.map((item) => (
    //                         <Col md={8} lg={6} key={item.class_id} className="mb-3">
    //                             <Card>
    //                                 <Card.Body>
    //                                     <Card.Title>{item.class_name}</Card.Title>
    //                                     <Card.Text>
    //                                         <small className="text-muted">
    //                                             {item.course_title} - {item.instructor_name}
    //                                         </small>
    //                                     </Card.Text>
    //                                     <div className="mb-3">
    //                                         <Badge 
    //                                             bg={item.livestream.isLive ? "danger" : "secondary"}
    //                                             className="me-2"
    //                                         >
    //                                             {item.livestream.isLive ? "Đang Live" : "Đã dừng"}
    //                                         </Badge>
    //                                         {item.livestream.liveStartTime && (
    //                                             <small className="text-muted">
    //                                                 {new Date(item.livestream.liveStartTime).toLocaleDateString()}
    //                                             </small>
    //                                         )}
    //                                     </div>
    //                                     {/* Hiển thị livestream player */}
    //                                     <div className="ratio ratio-16x9 mb-3">
    //                                         <iframe
    //                                             src={item.livestream.embedUrl}
    //                                             title={item.livestream.title || item.class_name}
    //                                             allowFullScreen
    //                                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    //                                             style={{ border: 'none' }}
    //                                         />
    //                                     </div>
    //                                     <div className="d-flex gap-2">
    //                                         <Button 
    //                                             size="sm" 
    //                                             variant="primary"
    //                                             onClick={() => setFullscreenLivestream(item)}
    //                                         >
    //                                             <i className="fas fa-expand me-1"></i>
    //                                             Xem toàn màn hình
    //                                         </Button>
    //                                         <Button 
    //                                             size="sm" 
    //                                             variant="outline-primary"
    //                                             onClick={() => openClass(item.class_id)}
    //                                         >
    //                                             Vào lớp học
    //                                         </Button>
    //                                         {item.livestream.youtubeUrl && (
    //                                             <Button 
    //                                                 size="sm" 
    //                                                 variant="outline-secondary"
    //                                                 onClick={() => window.open(item.livestream.youtubeUrl, '_blank')}
    //                                             >
    //                                                 <i className="fab fa-youtube me-1"></i>
    //                                                 Mở YouTube
    //                                             </Button>
    //                                         )}
    //                                     </div>
    //                                 </Card.Body>
    //                             </Card>
    //                         </Col>
    //                     ))}
    //                 </Row>
    //             </div>
    //         )}
    //         <div className="d-flex gap-3 flex-wrap">
    //             {enrollments.map((en) => (
    //                 <Card key={en._id} style={{ width: 320 }}>
    //                     <Card.Body>
    //                         <Card.Title>{en.class_id?.class_name}</Card.Title>
    //                         <Card.Text>
    //                             <Badge bg="success" className="me-2">{en.status}</Badge>
    //                             <small>
    //                                 Bắt đầu:{" "}
    //                                 {en.class_id?.start_date
    //                                     ? new Date(en.class_id.start_date).toLocaleDateString()
    //                                     : ""}
    //                             </small>
    //                         </Card.Text>
    //                         <div className="d-flex gap-2">
    //                             <Button size="sm" onClick={() => openClass(en.class_id?._id)}>
    //                                 Xem bài học
    //                             </Button>
    //                             {en.status === 'approved' && (
    //                                 <Button 
    //                                     size="sm" 
    //                                     variant="outline-primary"
    //                                     onClick={() => openClass(en.class_id?._id)}
    //                                 >
    //                                     <i className="fas fa-exchange-alt me-1"></i>
    //                                     Chuyển lớp
    //                                 </Button>
    //                             )}
    //                         </div>
    //                     </Card.Body>
    //                 </Card>
    //             ))}
    //         </div>

    //         {selectedClass && (
    //             <div className="mt-4">
    //                 <Row>
    //                     <Col md={8}>
    //                         <h4>{selectedClass.class_name}</h4>
                    
    //                         <LivestreamViewer 
    //                           classId={selectedClass._id} 
    //                           title={`Livestream: ${selectedClass.class_name}`} 
    //                         />
    //                         <Accordion defaultActiveKey="0">
    //                             {(selectedClass.lessons || []).map((ls, idx) => (
    //                                 <Accordion.Item eventKey={String(idx)} key={idx}>
    //                                     <Accordion.Header>{ls.lesson_name}</Accordion.Header>
    //                                     <Accordion.Body>
    //                                         {ls.video_url ? (
    //                                             <div className="ratio ratio-16x9 mb-3">
    //                                                 <iframe
    //                                                     src={getEmbedUrl(ls.video_url)}
    //                                                     title={ls.lesson_name}
    //                                                     allowFullScreen
    //                                                 />
    //                                             </div>
    //                                         ) : null}
                                            
    //                                         {ls.file && ls.file.url ? (
    //                                             <div className="mb-3 p-3 border rounded bg-light">
    //                                                 <h6 className="mb-2">
    //                                                     <i className="fas fa-file-download me-2"></i>
    //                                                     Tài liệu bài học
    //                                                 </h6>
    //                                                 <div className="d-flex align-items-center">
    //                                                     <i className="fas fa-file-pdf me-2 text-danger"></i>
    //                                                     <span className="me-3">{ls.file.original_name || 'Tài liệu'}</span>
    //                                                     <Button 
    //                                                         size="sm" 
    //                                                         variant="outline-primary"
    //                                                         onClick={() => window.open(ls.file.url, '_blank')}
    //                                                     >
    //                                                         <i className="fas fa-download me-1"></i>
    //                                                         Tải về
    //                                                     </Button>
    //                                                 </div>
    //                                             </div>
    //                                         ) : null}
                                            
    //                                         <div dangerouslySetInnerHTML={{ __html: ls.content || "" }} />
    //                                     </Accordion.Body>
    //                                 </Accordion.Item>
    //                             ))}
    //                         </Accordion>
    //                     </Col>
    //                     <Col md={4}>
    //                         <ClassTransfer 
    //                             currentClassId={selectedClass._id}
    //                             onTransferComplete={handleTransferComplete}
    //                         />
    //                         <div className="mt-3">
    //                             <RealtimeChat 
    //                               classId={selectedClass._id}
    //                               instructor={selectedClass.instructor_id}
    //                             />
    //                         </div>
    //                     </Col>
    //                 </Row>
    //             </div>
    //         )}

    //         {/* Modal Livestream Toàn màn hình */}
    //         <Modal 
    //             show={fullscreenLivestream !== null} 
    //             onHide={() => setFullscreenLivestream(null)}
    //             size="xl"
    //             centered
    //             fullscreen="lg-down"
    //         >
    //             <Modal.Header closeButton>
    //                 <Modal.Title>
    //                     <i className="fas fa-broadcast-tower text-danger me-2"></i>
    //                     {fullscreenLivestream?.class_name} - Livestream
    //                 </Modal.Title>
    //             </Modal.Header>
    //             <Modal.Body className="p-0">
    //                 {fullscreenLivestream && (
    //                     <div className="ratio ratio-16x9" style={{ height: '70vh' }}>
    //                         <iframe
    //                             src={fullscreenLivestream.livestream.embedUrl}
    //                             title={fullscreenLivestream.livestream.title || fullscreenLivestream.class_name}
    //                             allowFullScreen
    //                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    //                             style={{ border: 'none' }}
    //                         />
    //                     </div>
    //                 )}
    //             </Modal.Body>
    //             <Modal.Footer>
    //                 <div className="d-flex justify-content-between w-100">
    //                     <div>
    //                         <small className="text-muted">
    //                             {fullscreenLivestream?.course_title} - {fullscreenLivestream?.instructor_name}
    //                         </small>
    //                     </div>
    //                     <div>
    //                         <Button 
    //                             variant="outline-secondary" 
    //                             onClick={() => window.open(fullscreenLivestream?.livestream.youtubeUrl, '_blank')}
    //                         >
    //                             <i className="fab fa-youtube me-1"></i>
    //                             Mở trên YouTube
    //                         </Button>
    //                     </div>
    //                 </div>
    //             </Modal.Footer>
    //         </Modal>
    //     </Container>
    // );

     return (
        <Container className="mt-3">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Khóa học của tôi</h3>
            <Button variant="outline-info" size="sm" onClick={debugLivestream}>
                🔍 Debug Livestream
            </Button>
            </div>
            {message && <div className="alert alert-info py-2 my-2">{message}</div>}

            {/* Danh sách lớp học đã đăng ký */}
            <Row xs={1} sm={2} md={3} lg={4} className="g-3 mb-4">
            {enrollments.map((en) => (
                <Col key={en._id}>
                <Card className="h-100 shadow-sm border-0" style={{ borderRadius: "12px" }}>
                    {/* Header màu ngẫu nhiên */}
                    <div
                    style={{
                        height: "120px",
                        background: getRandomBg(),
                    }}
                    />
                    <Card.Body>
                    <Card.Title className="text-truncate">{en.class_id?.class_name}</Card.Title>
                    <Card.Text>
                        <small className="text-muted d-block mb-2">
                        {en.class_id?.course_id?.course_name || "Khóa học"}
                        </small>
                        <Badge bg="success" className="me-2">{en.status}</Badge>
                        <small>
                        Bắt đầu:{" "}
                        {en.class_id?.start_date
                            ? new Date(en.class_id.start_date).toLocaleDateString()
                            : ""}
                        </small>
                    </Card.Text>
                    <div className="d-flex justify-content-between mt-3">
                        <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => openClass(en.class_id?._id)}
                        >
                        Vào lớp học
                        </Button>
                        {en.class_id?.livestream?.isLive && (
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setFullscreenLivestream(en.class_id)}
                        >
                            <i className="fas fa-broadcast-tower me-1"></i>
                            Live
                        </Button>
                        )}
                    </div>
                    </Card.Body>
                </Card>
                </Col>
            ))}
            </Row>

            {/* Nếu chọn lớp thì hiển thị chi tiết */}
            {selectedClass && (
            <div className="mt-4">
                <Row>
                {/* Nội dung chính */}
                <Col md={8}>
                    <h4>{selectedClass.class_name}</h4>

                    {/* Livestream */}
                    <LivestreamViewer
                    classId={selectedClass._id}
                    title={`Livestream: ${selectedClass.class_name}`}
                    />

                    {/* Danh sách bài học */}
                    <Accordion defaultActiveKey="0">
                    {(selectedClass.lessons || []).map((ls, idx) => (
                        <Accordion.Item eventKey={String(idx)} key={idx}>
                        <Accordion.Header>{ls.lesson_name}</Accordion.Header>
                        <Accordion.Body>
                            {ls.video_url && (
                            <div className="ratio ratio-16x9 mb-3">
                                <iframe
                                src={getEmbedUrl(ls.video_url)}
                                title={ls.lesson_name}
                                allowFullScreen
                                />
                            </div>
                            )}

                            {ls.file?.url && (
                            <div className="mb-3 p-3 border rounded bg-light">
                                <h6 className="mb-2">
                                <i className="fas fa-file-download me-2"></i>
                                Tài liệu bài học
                                </h6>
                                <div className="d-flex align-items-center">
                                <i className="fas fa-file-pdf me-2 text-danger"></i>
                                <span className="me-3">
                                    {ls.file.original_name || "Tài liệu"}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => window.open(ls.file.url, "_blank")}
                                >
                                    <i className="fas fa-download me-1"></i>
                                    Tải về
                                </Button>
                                </div>
                            </div>
                            )}

                            <div dangerouslySetInnerHTML={{ __html: ls.content || "" }} />
                        </Accordion.Body>
                        </Accordion.Item>
                    ))}
                    </Accordion>
                </Col>

                {/* Sidebar */}
                <Col md={4}>
                    <ClassTransfer
                    currentClassId={selectedClass._id}
                    onTransferComplete={handleTransferComplete}
                    />
                    <div className="mt-3">
                    <RealtimeChat classId={selectedClass._id} instructor={selectedClass.instructor_id} />
                    </div>
                </Col>
                </Row>
            </div>
            )}

            {/* Modal livestream toàn màn hình */}
            <Modal
            show={fullscreenLivestream !== null}
            onHide={() => setFullscreenLivestream(null)}
            size="xl"
            centered
            fullscreen="lg-down"
            >
            <Modal.Header closeButton>
                <Modal.Title>
                <i className="fas fa-broadcast-tower text-danger me-2"></i>
                {fullscreenLivestream?.class_name} - Livestream
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                {fullscreenLivestream && (
                <div className="ratio ratio-16x9" style={{ height: "70vh" }}>
                    <iframe
                    src={fullscreenLivestream.livestream.embedUrl}
                    title={fullscreenLivestream.livestream.title || fullscreenLivestream.class_name}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={{ border: "none" }}
                    />
                </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <div className="d-flex justify-content-between w-100">
                <small className="text-muted">
                    {fullscreenLivestream?.course_title} - {fullscreenLivestream?.instructor_name}
                </small>
                {fullscreenLivestream?.livestream.youtubeUrl && (
                    <Button
                    variant="outline-secondary"
                    onClick={() => window.open(fullscreenLivestream.livestream.youtubeUrl, "_blank")}
                    >
                    <i className="fab fa-youtube me-1"></i>
                    Mở trên YouTube
                    </Button>
                )}
                </div>
            </Modal.Footer>
            </Modal>
        </Container>
        );
   
};

export default Learning;
