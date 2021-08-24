import { useState } from 'react';
import { Row, Col, ListGroup, Modal, Form, Button, Spinner } from 'react-bootstrap';
import { FaPause, FaPlay, FaPencilAlt, FaBars } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { AlertMessage, statusModal } from '../Interfaces/AlertMessage';

export interface AttachmentRequired {
    id: string;
    description: string;
    order: number;
    active: boolean;
}

interface AttachmentRequiredProps {
    attachmentRequired: AttachmentRequired;
    listAttachmentsRequired: AttachmentRequired[];
    handleListEvents(): Promise<void>;
}

const validationSchema = Yup.object().shape({
    description: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    order: Yup.number().required(),
    active: Yup.boolean().notRequired(),
});

const AttachmentsRequiredProject: React.FC<AttachmentRequiredProps> = ({ attachmentRequired, listAttachmentsRequired, handleListEvents }) => {
    const [showModalEditDoc, setShowModalEditDoc] = useState(false);

    const handleCloseModalEditDoc = () => { setShowModalEditDoc(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditDoc = () => setShowModalEditDoc(true);

    const [attachmentRequiredPausing, setEventPausing] = useState(false);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    const togglePauseEvent = async () => {
        setEventPausing(true);

        try {
            await api.put(`attachments-required/project/${attachmentRequired.id}`, {
                description: attachmentRequired.description,
                order: attachmentRequired.order,
                active: !attachmentRequired.active,
            });

            await handleListEvents();
        }
        catch (err) {
            console.log("Error to pause required attachment");
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
            await api.delete(`attachments-required/project/${attachmentRequired.id}`);

            const list = listAttachmentsRequired.filter(item => { return item.id !== attachmentRequired.id });

            list.forEach(async (attachmentRequired, index) => {
                try {
                    await api.put(`attachments-required/project/${attachmentRequired.id}`, {
                        description: attachmentRequired.description,
                        order: index,
                        active: attachmentRequired.active,
                    });
                }
                catch (err) {
                    console.log('error to save attachmentRequireds order after deleting.');
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

            console.log("Error to delete attachmentRequired");
            console.log(err);
        }
    }

    return (
        <ListGroup.Item variant={attachmentRequired.active ? "light" : "danger"}>
            <Row className="align-items-center">
                <Col sm={1}>
                    <FaBars />
                </Col>

                <Col><span>{attachmentRequired.description}</span></Col>

                <Col className="text-end">
                    <Button
                        variant="outline-success"
                        className="button-link"
                        onClick={togglePauseEvent}>
                        {
                            attachmentRequiredPausing ? <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            /> : attachmentRequired.active ? (<><FaPause /> Pausar</>) : (<><FaPlay /> Pausado</>)
                        }
                    </Button>
                </Col>

                <Col className="text-end">
                    <Button variant="outline-success" className="button-link" onClick={handleShowModalEditDoc}><FaPencilAlt /> Editar</Button>
                </Col>
            </Row>

            <Modal show={showModalEditDoc} onHide={handleCloseModalEditDoc}>
                <Modal.Header closeButton>
                    <Modal.Title>Edtiar attachmentRequiredumento</Modal.Title>
                </Modal.Header>
                <Formik
                    initialValues={
                        {
                            description: attachmentRequired.description,
                            order: attachmentRequired.order,
                            active: attachmentRequired.active,
                        }
                    }
                    onSubmit={async values => {
                        setTypeMessage("waiting");
                        setMessageShow(true);

                        try {
                            if (listAttachmentsRequired) {
                                await api.put(`attachments-required/project/${attachmentRequired.id}`, {
                                    description: values.description,
                                    order: attachmentRequired.order,
                                    active: attachmentRequired.active,
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
                            console.log('error create attachmentRequired.');
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
                                <Form.Group controlId="attachmentRequiredFormGridName">
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
                                                title="Excluir attachmentRequiredo."
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

export default AttachmentsRequiredProject;