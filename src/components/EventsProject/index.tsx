import { useState } from 'react';
import { Row, Col, ListGroup, Modal, Form, Button, Spinner } from 'react-bootstrap';
import { FaPause, FaPlay, FaPencilAlt, FaBars } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { AlertMessage, statusModal } from '../faces/AlertMessage'

export interface EventProject {
    id: string;
    description: string;
    order: number;
    active: boolean;
}

interface EventProjectProps {
    event: EventProject;
    listEvents: EventProject[];
    handleListEvents(): Promise<void>;
}

const validationSchema = Yup.object().shape({
    description: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    order: Yup.number().required(),
    active: Yup.boolean().notRequired(),
});

const EventsProject: React.FC<EventProjectProps> = ({ event, listEvents, handleListEvents }) => {
    const [showModalEditDoc, setShowModalEditDoc] = useState(false);

    const handleCloseModalEditDoc = () => { setShowModalEditDoc(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditDoc = () => setShowModalEditDoc(true);

    const [eventPausing, setEventPausing] = useState(false);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    const togglePauseEvent = async () => {
        setEventPausing(true);

        try {
            await api.put(`events/project/${event.id}`, {
                description: event.description,
                order: event.order,
                active: !event.active,
            });

            await handleListEvents();
        }
        catch (err) {
            console.log("Error to pause event");
            console.log(err);
        }

        setEventPausing(false);
    }

    async function deleteProduct() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setTypeMessage("waiting");
        setMessageShow(true);

        try {
            await api.delete(`events/project/${event.id}`);

            const list = listEvents.filter(item => { return item.id !== event.id });

            list.forEach(async (event, index) => {
                try {
                    await api.put(`events/project/${event.id}`, {
                        description: event.description,
                        order: index,
                        active: event.active,
                    });
                }
                catch (err) {
                    console.log('error to save events order after deleting.');
                    console.log(err)
                }
            });

            handleCloseModalEditDoc();

            handleListEvents();
        }
        catch (err) {
            setIconDeleteConfirm(false);
            setIconDelete(true);

            setTypeMessage("error");

            setTimeout(() => {
                setMessageShow(false);
            }, 1000);

            console.log("Error to delete event");
            console.log(err);
        }
    }

    return (
        <ListGroup.Item variant={event.active ? "light" : "danger"}>
            <Row className="align-items-center">
                <Col sm={1}>
                    <FaBars />
                </Col>

                <Col><span>{event.description}</span></Col>

                <Col className="text-end">
                    <Button
                        variant="outline-success"
                        className="button-link"
                        onClick={togglePauseEvent}>
                        {
                            eventPausing ? <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            /> : event.active ? (<><FaPause /> Pausar</>) : (<><FaPlay /> Pausado</>)
                        }
                    </Button>
                </Col>

                <Col className="text-end">
                    <Button variant="outline-success" className="button-link" onClick={handleShowModalEditDoc}><FaPencilAlt /> Editar</Button>
                </Col>
            </Row>

            <Modal show={showModalEditDoc} onHide={handleCloseModalEditDoc}>
                <Modal.Header closeButton>
                    <Modal.Title>Edtiar eventumento</Modal.Title>
                </Modal.Header>
                <Formik
                    initialValues={
                        {
                            description: event.description,
                            order: event.order,
                            active: event.active,
                        }
                    }
                    onSubmit={async values => {
                        setTypeMessage("waiting");
                        setMessageShow(true);

                        try {
                            if (listEvents) {
                                await api.put(`events/project/${event.id}`, {
                                    description: values.description,
                                    order: event.order,
                                    active: event.active,
                                });

                                await handleListEvents();

                                setTypeMessage("success");

                                setTimeout(() => {
                                    setMessageShow(false);
                                    handleCloseModalEditDoc();
                                }, 2000);
                            }
                        }
                        catch (err) {
                            console.log('error create event.');
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
                                <Form.Group controlId="eventFormGridName">
                                    <Form.Label>Descrição</Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Nome"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.description}
                                        name="description"
                                        isInvalid={!!errors.description && touched.description}
                                    />
                                    <Form.Control.Feedback type="invalid">{touched.description && errors.description}</Form.Control.Feedback>
                                    <Form.Text className="text-muted text-right">{`${values.description.length}/50 caracteres.`}</Form.Text>
                                </Form.Group>

                            </Modal.Body>
                            <Modal.Footer>
                                {
                                    messageShow ? <AlertMessage status={typeMessage} /> :
                                        <>
                                            <Button variant="secondary" onClick={handleCloseModalEditDoc}>Cancelar</Button>
                                            <Button
                                                title="Excluir evento."
                                                variant={iconDelete ? "outline-danger" : "outline-warning"}
                                                onClick={deleteProduct}
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

export default EventsProject;