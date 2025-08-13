import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { Form, Button } from 'react-bootstrap';
import { MyUserContext } from '../configs/Contexts';
import Apis, { authApis, endpoints } from '../configs/Apis';
const ComplaintForm = () => {
  const [user] = useContext(MyUserContext); // lấy user từ context

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');

useEffect(() => {
  if (user && user.userId)
    setUserId(user.userId);
}, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('status', status);
    formData.append('userId', userId);

    try {
      console.log("Submitting complaint:");
for (let [key, value] of formData.entries()) {
  console.log(`${key}:`, value);
}
      const res = await authApis().post(endpoints['complaints'], formData, {
       
        headers: {
           'Content-Type': 'application/x-www-form-urlencoded'
        },
      });
      alert('Gửi khiếu nại thành công!');
      console.log(res.data);
    } catch (err) {
      console.error('Lỗi khi gửi khiếu nại:', err);
      alert('Có lỗi xảy ra khi gửi khiếu nại!');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Gửi Khiếu Nại</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Tiêu đề</Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề khiếu nại"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Mô tả</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập nội dung khiếu nại"
            required
          />
        </Form.Group>

        {/* Trường userId ẩn */}
        <input type="hidden" name="userId" value={userId} />

        <Button variant="primary" type="submit">
          Gửi Khiếu Nại
        </Button>
      </Form>
    </div>
  );
};

export default ComplaintForm;
