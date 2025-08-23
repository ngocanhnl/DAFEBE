

import { useContext, useEffect, useRef, useState } from "react";
import Chatbot from "./Chatbot";
import { Alert, Button, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import CourseList from "./CourseList";

const Home = () => {
    return (
        <>
            <Container className="mt-4">
                <Row className="mb-3">
                    <Col>
                        <div className="p-3 bg-light rounded-2">
                            <h3>Chào mừng đến với Ngoại ngữ Online</h3>
                            <div className="text-muted">Học ngoại ngữ mọi lúc mọi nơi với các khóa học chất lượng.</div>
                            <div className="mt-3">
                                <Button as={Link} to="/courses">Khám phá khóa học</Button>
                            </div>
                        </div>
                    </Col>
                </Row>
                <CourseList />
            </Container>
            <Chatbot />
        </>
    );
};

export default Home;
