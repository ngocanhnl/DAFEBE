
// import { useContext } from "react";
// import { Navbar, Container, Nav, NavDropdown, Button, Image } from "react-bootstrap";
// import { Link, useNavigate } from "react-router-dom";
// import { MyUserContext } from "../../configs/Contexts";

// const Header = () => {
//     const [user, dispatch] = useContext(MyUserContext);
//     const navigate = useNavigate();

//     const handleLogout = () => {
//         dispatch({ type: "logout" });
//         navigate("/");
//     };

//     return (
//         <Navbar expand="lg" bg="light" className="shadow-sm px-3">
//             <Container fluid>
//                 <Navbar.Brand as={Link} to="/" className="fw-bold text-primary">
//                     Apartment Management
//                 </Navbar.Brand>

//                 <Navbar.Toggle aria-controls="basic-navbar-nav">
//                     <span className="navbar-toggler-icon" />
//                 </Navbar.Toggle>

//                 <Navbar.Collapse id="basic-navbar-nav">

//                     <Nav className="me-auto">
//                         <Nav.Link as={Link} to="/">Trang chủ</Nav.Link>
//                     </Nav>

//                     <Nav className="ms-auto align-items-center gap-2">
//                         {user === null ? (
//                             <>
//                                 <Nav.Link as={Link} to="/register" className="text-info">Đăng ký</Nav.Link>
//                                 <Nav.Link as={Link} to="/login" className="text-info">Đăng nhập</Nav.Link>
//                             </>
//                         ) : (
//                             <NavDropdown
//                                 title={
//                                     <span className="d-flex align-items-center gap-2">
//                                         <Image src={user.avatarUrl} roundedCircle width={30} height={30} />
//                                         <span className="text-info">{user.fullName}</span>
//                                     </span>
//                                 }
//                                 id="user-nav-dropdown"
//                                 align="end"
//                             >
//                                 <NavDropdown.Item as={Link} to="/profile">Trang cá nhân</NavDropdown.Item>
//                                 <NavDropdown.Item as={Link} to="/invoices">Hóa đơn</NavDropdown.Item>
//                                 <NavDropdown.Item as={Link} to="/complaints">Khiếu nại</NavDropdown.Item>
//                                 <NavDropdown.Item as={Link} to="/myLocker">Tủ đồ của tôi</NavDropdown.Item>                          
//                                 <NavDropdown.Item as={Link} to="/vehicle-card">Thẻ xe</NavDropdown.Item>
//                                 <NavDropdown.Item as={Link} to="/survey-list">Khảo sát</NavDropdown.Item>
//                                 <NavDropdown.Divider />
//                                 <NavDropdown.Item onClick={handleLogout} className="text-danger">
//                                     Đăng xuất
//                                 </NavDropdown.Item>
//                             </NavDropdown>
//                         )}
//                     </Nav>


//                 </Navbar.Collapse>
//             </Container>
//         </Navbar>
//     );
// };

// export default Header;
import { useContext } from "react";
import { Link } from "react-router-dom";
import { MyUserContext } from "../../configs/Contexts";
import { Image } from "react-bootstrap";
import { FaHome, FaSignOutAlt, FaSignInAlt, FaBook, FaShoppingCart, FaChalkboardTeacher } from "react-icons/fa";

const Header = ({ onLogout }) => {
    const [user] = useContext(MyUserContext);

    return (
        <div className="d-flex flex-column bg-light vh-100 p-3 shadow" style={{ width: "250px" }}>
            <h4 className="text-primary fw-bold mb-4">Ngoại ngữ Online</h4>

            <Link to="/" className="mb-2 text-decoration-none text-dark d-flex align-items-center gap-2">
                <FaHome /> <span>Trang chủ</span>
            </Link>
            <Link to="/courses" className="mb-2 text-decoration-none text-dark d-flex align-items-center gap-2">
                <FaBook /> <span>Khóa học</span>
            </Link>
            <Link to="/cart" className="mb-2 text-decoration-none text-dark d-flex align-items-center gap-2">
                <FaShoppingCart /> <span>Giỏ hàng</span>
            </Link>
            <Link to="/learning" className="mb-2 text-decoration-none text-dark d-flex align-items-center gap-2">
                <FaChalkboardTeacher /> <span>Học tập</span>
            </Link>

            {user === null ? (
                <>
                    <Link to="/login" className="mb-2 text-decoration-none text-dark d-flex align-items-center gap-2">
                        <FaSignInAlt /> <span>Đăng nhập</span>
                    </Link>
                </>
            ) : (
                <>
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <Image src={user.avatarUrl} roundedCircle width={40} height={40} />
                        <div>
                            <strong className="text-info">{user.fullName}</strong>
                        </div>
                    </div>

                    
                    <div
                        onClick={onLogout}
                        className="mt-3 text-danger text-decoration-none d-flex align-items-center gap-2"
                        style={{ cursor: "pointer" }}
                    >
                        <FaSignOutAlt /> <span>Đăng xuất</span>
                    </div>
                </>
            )}
        </div>
    );
};

export default Header;
