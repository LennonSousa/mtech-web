import { useState } from 'react';
import { Row, Col, ListGroup, Modal, Form, Button, Spinner } from 'react-bootstrap';
import { FaPencilAlt, FaBars, FaPause, FaPlay } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { Project } from '../Projects';
import { AlertMessage, statusModal } from '../Interfaces/AlertMessage'

export interface PayType {
    id: string;
    name: string;
    order: number;
    active: boolean;
    projects: Project[];
}

interface PayTypesProps {
    payType: PayType;
    listTypes: PayType[];
    handleListTypes(): Promise<void>;
}

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    order: Yup.number().required(),
});

const PayTypes: React.FC<PayTypesProps> = ({ payType, listTypes, handleListTypes }) => {
    const [showModalEditType, setShowModalEditType] = useState(false);

    const handleCloseModalEditType = () => { setShowModalEditType(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditType = () => setShowModalEditType(true);

    const [messageShow, setMessageShow] = useState(false);
    const [statusMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [itemPausing, setItemPausing] = useState(false);

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    async function deleteItem() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setTypeMessage("waiting");
        setMessageShow(true);

        try {
            await api.delete(`payments/types/${payType.id}`);

            const list = listTypes.filter(item => { return item.id !== payType.id });

            list.forEach(async (payType, index) => {
                try {
                    await api.put(`payments/types/${payType.id}`, {
                        name: payType.name,
                        order: index
                    });
                }
                catch (err) {
                    console.log('error to save pay type order after deleting.');
                    console.log(err)
                }
            });

            handleCloseModalEditType();

            handleListTypes();
        }
        catch (err) {
            setIconDeleteConfirm(false);
            setIconDelete(true);

            setTypeMessage("error");

            setTimeout(() => {
                setMessageShow(false);
            }, 4000);

            console.log("Error to delete pay type");
            console.log(err);
        }
    }

    const togglePauseItem = async () => {
        setItemPausing(true);

        try {
            await api.put(`payments/types/${payType.id}`, {
                name: payType.name,
                active: !payType.active,
                order: payType.order,
            });

            await handleListTypes();
        }
        catch (err) {
            console.log("Error to pause payType");
            console.log(err);
        }

        setItemPausing(false);
    }

    return (
        <ListGroup.Item variant={payType.active ? "light" : "danger"}>
            <Row className="align-items-center">
                <Col sm={1}>
                    <FaBars />
                </Col>

                <Col><span>{payType.name}</span></Col>

                <Col className="col-row text-end">
                    <Button
                        variant="outline-success"
                        className="button-link"
                        onClick={togglePauseItem}
                        title="Pausar painel"
                    >
                        {
                            itemPausing ? <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            /> : payType.active ? (<><FaPause /> Pausar</>) : (<><FaPlay /> Pausado</>)
                        }
                    </Button>
                </Col>

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
                            name: payType.name,
                            order: payType.order,
                        }
                    }
                    onSubmit={async values => {
                        setTypeMessage("waiting");
                        setMessageShow(true);

                        try {
                            if (listTypes) {
                                await api.put(`payments/types/${payType.id}`, {
                                    name: values.name,
                                    order: payType.order
                                });

                                await handleListTypes();

                                setTypeMessage("success");

                                setTimeout(() => {
                                    setMessageShow(false);
                                    handleCloseModalEditType();
                                }, 2000);
                            }
                        }
                        catch (err) {
                            console.log('error edit payType.');
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

                            </Modal.Body>
                            <Modal.Footer>
                                {
                                    messageShow ? <AlertMessage status={statusMessage} /> :
                                        <>
                                            <Button variant="secondary" onClick={handleCloseModalEditType}>Cancelar</Button>
                                            <Button
                                                title="Excluir item"
                                                variant={iconDelete ? "outline-danger" : "outline-warning"}
                                                onClick={deleteItem}
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

export default PayTypes;