import React, { useContext, useEffect, useRef } from 'react';
import { Card, Row, Col, Container, Badge, Form, Alert, Button } from 'react-bootstrap';
import { MyUserContext } from '../configs/Contexts'; // file context của bạn
import { useState } from 'react';
import Apis, { authApis, endpoints } from '../configs/Apis';
import { useNavigate } from 'react-router-dom';
import MySpinner from './layout/MySpinner';

const Profile = () => {
    const [user,dispatch] = useContext(MyUserContext);
    const avatar = useRef();
    const [user2, setUser2] = useState({});
    const [msg, setMsg] = useState();
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();
    const [previewAvatar, setPreviewAvatar] = useState(null);
     
    const fields = [
     
        { title: "Họ và tên lót", field: "fullName", type: "text" },
        { title: "Số điện thoại", field: "phone", type: "tel" },
        { title: "Email", field: "email", type: "email" },
        { title: "Tên đăng nhập", field: "username", type: "text" },
    ];
    
        

    const validate = () => {
        // if (user.confirm === null || user.password === null || user.confirm !== user.password)
        //     setMsg("Mật khẩu KHÔNG khớp!");

        return true;
    }
    useEffect(() => {
        if (user) {
            setUser2({
                fullName: user.fullName,
                phone: user.phone,
                email: user.email,
                username: user.username,
                avatarUrl: user.avatarUrl,
            });
            setPreviewAvatar(user.avatarUrl); 
        }
    }, [user]);




    const updateProfile = async (event) => {
            event.preventDefault();
    
            if (validate()) {
               try {
                setLoading(true);
                    let formData = new FormData();
                    for (let key in user2)
                        if (key !== 'confirm')
                            formData.append(key, user2[key]);
    
                    if (avatar.current.files.length > 0) {
                        formData.append("avatar", avatar.current.files[0]);
                        
                    }
                    formData.append("username", user.username);
                    
                    let res = await authApis().post(endpoints['updateProfile'], formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    console.info("res.data",res.data);
                     dispatch({
                        "type": "login",
                        "payload": res.data
                    });
                    console.log("user2", user2);
                    
    
                    if (res.status === 201)
                        nav("/profile");
               } catch (ex) {
                    console.error(ex);
               } finally {
                setLoading(false);
               }
            }
    
            
        }

    const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file)
      setPreviewAvatar(URL.createObjectURL(file));
};

  return (
    <Container className="mt-4">
            <h1 className="text-center text-primary">Chỉnh sửa hồ sơ</h1>

            {msg && <Alert variant="danger">{msg}</Alert>}

            <Form onSubmit={updateProfile}>
                {fields.map(f => (
                    <Form.Group className="mb-3" key={f.field} controlId={f.field}>
                        <Form.Label>{f.title}</Form.Label>
                        <Form.Control
                            type={f.type}
                            value={user2[f.field] || ""}
                            onChange={e => setUser2({ ...user2, [f.field]: e.target.value })}
                            required
                        />
                    </Form.Group>
                ))}

                <Form.Group className="mb-3">
                    <Form.Label>Ảnh đại diện</Form.Label>
                    <div><img width={300} src={previewAvatar || user?.avatarUrl || "https://via.placeholder.com/150"} /></div>
                    <Form.Control type="file" ref={avatar} onChange={handleAvatarChange}/>
                </Form.Group>

                {loading ? <MySpinner /> : (
                    <Button type="submit" variant="primary">Cập nhật</Button>
                )}
            </Form>
        </Container>
  );
};

export default Profile;
