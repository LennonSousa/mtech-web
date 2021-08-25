import { Row, Col, Modal } from 'react-bootstrap';

import styles from './shimmer.module.css';

const ProductModalShimmer: React.FC = () => {
    return (
        <Modal.Body>
            <Row className="mb-3 wrapper">
                <Col>
                    <Row className="align-items-end">
                        <Col md={3} sm={1}>
                            <div className="div-product-image animate"></div>
                        </Col>

                        <Col>
                            <div className="div-product-field animate"></div>
                        </Col>
                    </Row>

                    <Row className="mt-3">
                        <Col>
                            <div className="div-product-field animate"></div>
                        </Col>

                        <Col>
                            <div className="div-product-field animate"></div>
                        </Col>
                    </Row>

                    <Row className="mt-3">
                        <Col>
                            <div className="div-product-field animate"></div>
                        </Col>

                        <Col>
                            <div className="div-product-field animate"></div>
                        </Col>
                    </Row>

                    <Row className="mt-3">
                        <Col>
                            <div className="div-product-textarea animate"></div>
                        </Col>
                    </Row>

                    <Row className="mt-3">
                        <Col md={3} sm={1}>
                            <div className="div-product-field animate"></div>
                        </Col>

                        <Col md={3} sm={1} >
                            <div className="div-product-field animate"></div>
                        </Col>

                        <Col md={3} sm={1}>
                            <div className="div-product-field animate"></div>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Modal.Body>
    )
}

export default ProductModalShimmer;