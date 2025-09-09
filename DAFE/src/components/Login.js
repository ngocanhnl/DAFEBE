import { useContext, useState } from "react";
import { Button, Form } from "react-bootstrap";
import Apis, { authApis, endpoints } from "../configs/Apis";
import cookie from 'react-cookies'
import { MyUserContext } from "../configs/Contexts";
import { useNavigate, useSearchParams } from "react-router-dom";
import MySpinner from "./layout/MySpinner";
import { Link } from "react-router-dom";

const Login = () => {
    const [,dispatch] = useContext(MyUserContext);
    const [loading, setLoading] = useState(false);

    const info = [ {
        "title": "Email",
        "field": "email",
        "type": "email"
    }, {
        "title": "Mật khẩu",
        "field": "password",
        "type": "password"
    }];

    
    const [user, setUser] = useState({});
    const nav = useNavigate();
    const [q] = useSearchParams();

    const login = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            let res = await Apis.post(endpoints['login'], {
                ...user
            });

            const token = res.data.token || res.data.data?.token;
            cookie.save('token', token);

            let u = await authApis().get(endpoints['profile']);
            dispatch({
                "type": "login",
                "payload": u.data.data || u.data
            });
        
        let next = q.get('next');
        nav(next?next:"/");
        } catch (ex) {
            console.error(ex);
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <h1 className="text-center text-success mt-2">ĐĂNG NHẬP</h1>
            <Form onSubmit={login}>
                {info.map(i => <Form.Group key={i.field} className="mb-3" controlId={i.field}>
                    <Form.Label>{i.title}</Form.Label>
                    <Form.Control required value={user[i.field]} onChange={e => setUser({...user, [i.field]: e.target.value})} type={i.type} placeholder={i.title} />
                </Form.Group>)}

              
                {loading ? <MySpinner/>:<Form.Group className="mb-3" controlId="exampleForm.ControlInput2">
                    <Button type="submit" variant="success" className="me-2">Đăng nhập</Button>
                    <Link to="/register" className="me-2">Đăng ký</Link>
                    <Link to="/verify-otp">Xác thực OTP</Link>
                    <Link to="/forgot-password" className="ms-2">Quên mật khẩu</Link>
                </Form.Group>}
                
            </Form>
        </>
    );
}

export default Login;