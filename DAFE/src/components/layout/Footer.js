// import { Alert } from "react-bootstrap";

// const Footer = () => {
//     return (
//         <>
//             <Alert variant="info">Ecommerce &copy; 2025</Alert>
//         </>
//     );
// }

// export default Footer;

import { Container } from "react-bootstrap";

const Footer = () => {
    return (
        <footer className="footer-fixed bg-light text-center py-3">
            <Container>
                <span className="text-muted">Apartment Management &copy; 2025</span>
            </Container>
        </footer>
    );
};

export default Footer;
