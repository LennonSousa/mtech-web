import { useState } from 'react';
import { Row, Col, ListGroup, Modal, Form, Button } from 'react-bootstrap';
import { FaPencilAlt, FaBars } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { Estimate } from '../Estimates';
import { AlertMessage, statusModal } from '../interfaces/AlertMessage';

export interface RoofOrientation {
    id: string;
    name: string;
    increment: number;
    order: number;
    estimates: Estimate[];
}

interface RoofTypesProps {
    roofOrientation: RoofOrientation;
    listOrientations: RoofOrientation[];
    handleListOrientations(): Promise<void>;
}

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    increment: Yup.number().required('Obrigatório!'),
    order: Yup.number().required(),
});

const RoofTypes: React.FC<RoofTypesProps> = ({ roofOrientation, listOrientations, handleListOrientations }) => {
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
            await api.delete(`roofs/orientations/${roofOrientation.id}`);

            const list = listOrientations.filter(item => { return item.id !== roofOrientation.id });

            list.forEach(async (roofOrientation, index) => {
                try {
                    await api.put(`roofs/orientations/${roofOrientation.id}`, {
                        name: roofOrientation.name,
                        order: index
                    });
                }
                catch (err) {
                    console.log('error to save roofs orientations order after deleting.');
                    console.log(err)
                }
            });

            handleCloseModalEditType();

            handleListOrientations();
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

                <Col><span>{roofOrientation.name}</span></Col>

                <Col><span>{roofOrientation.increment}</span></Col>

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
                            name: roofOrientation.name,
                            increment: roofOrientation.increment,
                            order: roofOrientation.order,
                        }
                    }
                    onSubmit={async values => {
                        setTypeMessage("waiting");
                        setMessageShow(true);

                        try {
                            if (listOrientations) {
                                await api.put(`roofs/orientations/${roofOrientation.id}`, {
                                    name: values.name,
                                    increment: values.increment,
                                    order: roofOrientation.order
                                });

                                await handleListOrientations();

                                setTypeMessage("success");

                                setTimeout(() => {
                                    setMessageShow(false);
                                    handleCloseModalEditType();
                                }, 2000);
                            }
                        }
                        catch (err) {
                            console.log('error edit roofs orientations.');
                            console.log(err);

                            setTypeMessage("error");

                            setTimeout(() => {
                                setMessageShow(false);
                            }, 4000);
                        }
                    }}
                    validationSchema={validationSchema}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                        <Form onSubmit={handleSubmit}>
                            <Modal.Body>
                                <Form.Group controlId="statusFormGridName">
                                    <Form.Label>Nome</Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Nome"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.name}
                                        name="name"
                                        isInvalid={!!errors.name && touched.name}
                                    />
                                    <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                    <Form.Text className="text-muted text-right">{`${values.name.length}/50 caracteres.`}</Form.Text>
                                </Form.Group>

                                <Form.Group controlId="statusFormGridName">
                                    <Form.Label>Incremento</Form.Label>
                                    <Form.Control type="number"
                                        placeholder="Incremento"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.increment}
                                        name="increment"
                                        isInvalid={!!errors.increment && touched.increment}
                                    />
                                    <Form.Control.Feedback type="invalid">{touched.increment && errors.increment}</Form.Control.Feedback>
                                </Form.Group>
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

export default RoofTypes;