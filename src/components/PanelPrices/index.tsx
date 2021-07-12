import { useState } from 'react';
import { Row, Col, InputGroup, ListGroup, Modal, Form, Button } from 'react-bootstrap';
import { FaPencilAlt, FaBars } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { Panel } from '../Panels';
import { AlertMessage, statusModal } from '../interfaces/AlertMessage';
import { prettifyCurrency } from '../InputMask/masks';

export interface PanelPrice {
    id: string;
    potency: number;
    price: number;
    inversor: string;
    panel: Panel;
}

interface PanelPricesProps {
    panelPrice: PanelPrice;
    listPanelPrices: PanelPrice[];
    handleListPanelPrices(): Promise<void>;
}

const validationSchema = Yup.object().shape({
    potency: Yup.number().notRequired(),
    price: Yup.number().notRequired(),
    inversor: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
});

const PanelPrices: React.FC<PanelPricesProps> = ({ panelPrice, listPanelPrices, handleListPanelPrices }) => {
    const [showModalEditType, setShowModalEditType] = useState(false);

    const handleCloseModalEditType = () => { setShowModalEditType(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditType = () => setShowModalEditType(true);

    const [messageShow, setMessageShow] = useState(false);
    const [statusMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    async function deleteLine() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setTypeMessage("waiting");
        setMessageShow(true);

        try {
            await api.delete(`roofs/types/${panelPrice.id}`);

            const list = listPanelPrices.filter(item => { return item.id !== panelPrice.id });

            list.forEach(async (panelPrice, index) => {
                try {
                    await api.put(`roofs/types/${panelPrice.id}`, {
                        inversor: panelPrice.inversor,
                        order: index
                    });
                }
                catch (err) {
                    console.log('error to save roof type order after deleting.');
                    console.log(err)
                }
            });

            handleCloseModalEditType();

            handleListPanelPrices();
        }
        catch (err) {
            setIconDeleteConfirm(false);
            setIconDelete(true);

            setTypeMessage("error");

            setTimeout(() => {
                setMessageShow(false);
            }, 4000);

            console.log("Error to delete roof type");
            console.log(err);
        }
    }

    return (
        <ListGroup.Item variant="light">
            <Row className="align-items-center">
                <Col sm={1}>
                    <FaBars />
                </Col>

                <Col><span>{panelPrice.potency}</span></Col>

                <Col><span>{panelPrice.inversor}</span></Col>

                <Col><span>{panelPrice.price}</span></Col>

                <Col className="text-end">
                    <Button variant="outline-success" className="button-link" onClick={handleShowModalEditType}><FaPencilAlt /> Editar</Button>
                </Col>
            </Row>

            <Modal show={showModalEditType} onHide={handleCloseModalEditType}>
                <Modal.Header closeButton>
                    <Modal.Title>Edtiar item</Modal.Title>
                </Modal.Header>
                <Formik
                    initialValues={
                        {
                            potency: panelPrice.potency,
                            price: panelPrice.price,
                            inversor: panelPrice.inversor,
                        }
                    }
                    onSubmit={async values => {
                        setTypeMessage("waiting");
                        setMessageShow(true);

                        try {
                            if (listPanelPrices) {
                                await api.put(`roofs/types/${panelPrice.id}`, {
                                    potency: values.potency,
                                    price: values.price,
                                    inversor: values.inversor,
                                });

                                await handleListPanelPrices();

                                setTypeMessage("success");

                                setTimeout(() => {
                                    setMessageShow(false);
                                    handleCloseModalEditType();
                                }, 2000);
                            }
                        }
                        catch (err) {
                            console.log('error edit panel price.');
                            console.log(err);

                            setTypeMessage("error");

                            setTimeout(() => {
                                setMessageShow(false);
                            }, 4000);
                        }
                    }}
                    validationSchema={validationSchema}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, setFieldValue, errors, touched }) => (
                        <Form onSubmit={handleSubmit}>
                            <Modal.Body>
                                <Form.Row>
                                    <Form.Group as={Col} sm={2} controlId="formGridPotency">
                                        <Form.Label>Potência</Form.Label>
                                        <InputGroup className="mb-2">
                                            <InputGroup.Prepend>
                                                <InputGroup.Text id="btnGroupPotency">Kwp</InputGroup.Text>
                                            </InputGroup.Prepend>
                                            <Form.Control
                                                type="text"
                                                onChange={(e) => {
                                                    setFieldValue('potency', prettifyCurrency(e.target.value));
                                                }}
                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                    setFieldValue('potency', prettifyCurrency(e.target.value));
                                                }}
                                                value={values.potency}
                                                name="potency"
                                                isInvalid={!!errors.potency && touched.potency}
                                                aria-label="Potência"
                                                aria-describedby="btnGroupPotency"
                                            />
                                        </InputGroup>
                                        <Form.Control.Feedback type="invalid">{touched.potency && errors.potency}</Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Group as={Col} sm={2} controlId="formGridPrice">
                                        <Form.Label>Valor</Form.Label>
                                        <InputGroup className="mb-2">
                                            <InputGroup.Prepend>
                                                <InputGroup.Text id="btnGroupPrice">R$</InputGroup.Text>
                                            </InputGroup.Prepend>
                                            <Form.Control
                                                type="text"
                                                onChange={(e) => {
                                                    setFieldValue('price', prettifyCurrency(e.target.value));
                                                }}
                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                    setFieldValue('price', prettifyCurrency(e.target.value));
                                                }}
                                                value={values.price}
                                                name="price"
                                                isInvalid={!!errors.price && touched.price}
                                                aria-label="Valor"
                                                aria-describedby="btnGroupPrice"
                                            />
                                        </InputGroup>
                                        <Form.Control.Feedback type="invalid">{touched.price && errors.price}</Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Group controlId="statusFormGridInversor">
                                        <Form.Label>Inversor</Form.Label>
                                        <Form.Control type="text"
                                            placeholder="Inversor"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.inversor}
                                            name="inversor"
                                            isInvalid={!!errors.inversor && touched.inversor}
                                        />
                                        <Form.Control.Feedback type="invalid">{touched.inversor && errors.inversor}</Form.Control.Feedback>
                                        <Form.Text className="text-muted text-right">{`${values.inversor.length}/50 caracteres.`}</Form.Text>
                                    </Form.Group>
                                </Form.Row>

                            </Modal.Body>
                            <Modal.Footer>
                                {
                                    messageShow ? <AlertMessage status={statusMessage} /> :
                                        <>
                                            <Button variant="secondary" onClick={handleCloseModalEditType}>Cancelar</Button>
                                            <Button
                                                title="Excluir item"
                                                variant={iconDelete ? "outline-danger" : "outline-warning"}
                                                onClick={deleteLine}
                                            >
                                                {
                                                    iconDelete && "Excluir"
                                                }

                                                {
                                                    iconDeleteConfirm && "Confirmar"
                                                }
                                            </Button>
                                            <Button variant="success" type="submit">Salvar</Button>
                                        </>

                                }
                            </Modal.Footer>
                        </Form>
                    )}
                </Formik>
            </Modal>
        </ListGroup.Item>
    )
}

export default PanelPrices;