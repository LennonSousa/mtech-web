import { ChangeEvent, useState } from 'react';
import { Row, Col, ListGroup, Modal, Form, Button, Spinner } from 'react-bootstrap';
import { FaPencilAlt, FaCloudDownloadAlt, FaPlus, FaTrashAlt } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import FileSaver from 'file-saver';
import filesize from "filesize";
import { CircularProgressbar } from 'react-circular-progressbar';

import api from '../../api/api';
import { AttachmentRequired } from '../AttachmentsRequiredProject';
import { Project } from '../Projects';
import { AlertMessage, statusModal } from '../Interfaces/AlertMessage'

import "react-circular-progressbar/dist/styles.css";
import styles from './styles.module.css';

export interface ProjectAttachmentRequired {
    id: string;
    path: string | null;
    received_at: Date;
    attachmentRequired: AttachmentRequired;
    project: Project;
}

interface ProjectAttachmentRequiredProps {
    attachment: ProjectAttachmentRequired;
    canEdit?: boolean;
    handleListAttachmentsRequired?: () => Promise<void>;
}

const validationSchema = Yup.object().shape({
    path: Yup.string().notRequired().nullable(),
    size: Yup.number().lessThan(200 * 1024 * 1024, 'O arquivo não pode ultrapassar 200MB.').notRequired().nullable(),
    received_at: Yup.date().required('Obrigatório!'),
});

const AttachmentsRequired: React.FC<ProjectAttachmentRequiredProps> = ({ attachment, canEdit = true, handleListAttachmentsRequired }) => {
    const [showModalEditDoc, setShowModalEdit] = useState(false);

    const [fileToSave, setFileToSave] = useState<File>();
    const [filePreview, setFilePreview] = useState('');
    const [toDeleteFile, setToDeleteFile] = useState(false);

    const handleCloseModalEdit = () => setShowModalEdit(false);
    const handleShowModalEdit = () => {
        setToDeleteFile(false);
        setFileToSave(undefined);
        setFilePreview('');
        setShowModalEdit(true);
    }

    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [isUploading, setIsUploading] = useState(false);
    const [uploadingPercentage, setUploadingPercentage] = useState(0);
    const [messageShowNewAttachment, setMessageShowNewAttachment] = useState(false);
    const [downloadingAttachment, setDownloadingAttachment] = useState(false);

    async function handleDownloadAttachment() {
        setDownloadingAttachment(true);

        try {
            const res = await api.get(`projects/attachments-required/${attachment.id}`,
                { responseType: "blob" }
            );

            const fileName = `${attachment.project.customer.replace('.', '')} - ${attachment.attachmentRequired.description.replace('.', '')}`;

            FileSaver.saveAs(res.data, fileName);
        }
        catch (err) {
            console.log("Error to get attachment");
            console.log(err);
        }

        setDownloadingAttachment(false);
    }

    function handleImages(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files[0]) {
            const image = event.target.files[0];

            setFileToSave(image);

            const imagesToPreview = image.name;

            setFilePreview(imagesToPreview);
        }
    }

    return (
        <>
            <ListGroup.Item variant="light">
                <Row className="align-items-center">
                    <Col><span>{attachment.attachmentRequired.description}</span></Col>

                    <Col className="col-row">
                        {
                            attachment.path && <span>{`Recebido em ${format(new Date(attachment.received_at), 'dd/MM/yyyy')}`}</span>
                        }
                    </Col>

                    <Col sm={1} className="col-row text-right">
                        {
                            attachment.path && <Button
                                variant="outline-success"
                                className="button-link"
                                onClick={handleDownloadAttachment}
                                title="Baixar o anexo."
                            >
                                {downloadingAttachment ? <Spinner animation="border" variant="success" size="sm" /> : <FaCloudDownloadAlt />}
                            </Button>
                        }
                    </Col>

                    {
                        canEdit && <Col className="col-row text-right">
                            <Button
                                variant="outline-success"
                                className="button-link"
                                onClick={handleShowModalEdit}
                                title="Editar o anexo."
                            >
                                <FaPencilAlt /> Editar
                            </Button>
                        </Col>
                    }
                </Row>
            </ListGroup.Item>

            <Modal show={showModalEditDoc} onHide={handleCloseModalEdit}>
                <Modal.Header closeButton>
                    <Modal.Title>Edtiar anexo</Modal.Title>
                </Modal.Header>
                <Formik
                    initialValues={
                        {
                            path: attachment.path,
                            size: 0,
                            received_at: format(new Date(attachment.received_at), 'yyyy-MM-dd'),
                            attachmentRequired: attachment.attachmentRequired.id,
                            project: attachment.project.id,
                        }
                    }
                    onSubmit={async values => {
                        setUploadingPercentage(0);
                        if (fileToSave) setIsUploading(true);

                        setTypeMessage("waiting");
                        setMessageShowNewAttachment(true);

                        try {
                            const data = new FormData();

                            if (fileToSave) data.append('file', fileToSave);

                            data.append('received_at', `${values.received_at} 12:00:00`);

                            if (attachment.id === '0') {
                                data.append('attachmentRequired', values.attachmentRequired);
                                data.append('project', values.project);

                                await api.post(`projects/${values.project}/attachments-required`, data, {
                                    onUploadProgress: e => {
                                        const progress = Math.round((e.loaded * 100) / e.total);

                                        setUploadingPercentage(progress);
                                    },
                                    timeout: 0,
                                }).then(async () => {

                                    setIsUploading(false);
                                    setMessageShowNewAttachment(true);

                                    setTimeout(() => {
                                        setMessageShowNewAttachment(false);
                                        handleCloseModalEdit();
                                    }, 1000);
                                }).catch(err => {
                                    console.log('error create attachment.');
                                    console.log(err);

                                    setIsUploading(false);
                                    setMessageShowNewAttachment(true);
                                    setTypeMessage("error");

                                    setTimeout(() => {
                                        setMessageShowNewAttachment(false);
                                    }, 4000);
                                });
                            }
                            else {
                                if (toDeleteFile) {
                                    await api.delete(`projects/attachments-required/${attachment.id}`);
                                }

                                await api.put(`projects/${values.project}/attachments-required/${attachment.id}`, data, {
                                    onUploadProgress: e => {
                                        const progress = Math.round((e.loaded * 100) / e.total);

                                        setUploadingPercentage(progress);
                                    },
                                    timeout: 0,
                                }).then(async () => {
                                    //await handleListAttachments();

                                    setIsUploading(false);
                                    setMessageShowNewAttachment(true);

                                    setTimeout(() => {
                                        setMessageShowNewAttachment(false);
                                        handleCloseModalEdit();
                                    }, 1000);
                                }).catch(err => {
                                    console.log('error create required attachment.');
                                    console.log(err);

                                    setIsUploading(false);
                                    setMessageShowNewAttachment(true);
                                    setTypeMessage("error");

                                    setTimeout(() => {
                                        setMessageShowNewAttachment(false);
                                    }, 4000);
                                });
                            }

                            if (handleListAttachmentsRequired) await handleListAttachmentsRequired();

                            setTypeMessage("success");

                            setTimeout(() => {
                                setMessageShowNewAttachment(false);
                                handleCloseModalEdit();
                            }, 1000);
                        }
                        catch (err) {
                            console.log('error create required attachment.');
                            console.log(err);

                            setTypeMessage("error");

                            setTimeout(() => {
                                setMessageShowNewAttachment(false);
                            }, 4000);
                        }
                    }}
                    validationSchema={validationSchema}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, setFieldValue, errors, touched }) => (
                        <Form onSubmit={handleSubmit}>
                            <Modal.Body>
                                <Row className="mb-3">
                                    <Col>
                                        <h6 className="text-success text-wrap">{attachment.attachmentRequired.description}</h6>
                                    </Col>
                                </Row>

                                {
                                    values.path ? <>
                                        <Row className="mb-3">
                                            {
                                                values.path && attachment.path && <Form.Group as={Col} sm={2} controlId="formGridDownload">
                                                    <Button
                                                        variant="outline-success"
                                                        className="button-link"
                                                        onClick={handleDownloadAttachment}
                                                        title="Baixar o anexo."
                                                    >
                                                        {
                                                            downloadingAttachment ? <Spinner animation="border" variant="success" size="sm" /> :
                                                                <FaCloudDownloadAlt />
                                                        }
                                                    </Button>
                                                </Form.Group>
                                            }

                                            <Form.Group as={Col} sm={2} controlId="formGridDelete">
                                                <Button
                                                    variant="outline-danger"
                                                    className="button-link"
                                                    onClick={() => {
                                                        setToDeleteFile(true);
                                                        setFieldValue('path', null);
                                                        setFileToSave(undefined);
                                                        setFilePreview('');
                                                    }}
                                                    title="Excluir o anexo."
                                                >
                                                    <FaTrashAlt />
                                                </Button>
                                            </Form.Group>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col sm={8}>
                                                <Row>
                                                    <Col>
                                                        <h6 className="text-cut">{filePreview}</h6>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col>
                                                        <label className="text-wrap">{fileToSave ? filesize(fileToSave.size) : ''}</label>
                                                    </Col>
                                                </Row>
                                            </Col>

                                            <Col className="col-12">
                                                <label className="invalid-feedback" style={{ display: 'block' }}>{errors.path}</label>
                                                <label className="invalid-feedback" style={{ display: 'block' }}>{errors.size}</label>
                                            </Col>
                                        </Row>
                                    </> :
                                        <Row className="mb-3">
                                            <Col sm={4}>
                                                <label
                                                    title="Procurar um arquivo para anexar."
                                                    htmlFor="fileAttachement"
                                                    className={styles.productImageButton}
                                                >
                                                    <Row>
                                                        <Col>
                                                            <FaPlus />
                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col>Anexo</Col>
                                                    </Row>
                                                    <input
                                                        type="file"
                                                        onChange={(e) => {
                                                            handleImages(e);
                                                            if (e.target.files && e.target.files[0]) {
                                                                setFieldValue('path', e.target.files[0].name);
                                                                setFieldValue('size', e.target.files[0].size);
                                                            }
                                                        }}
                                                        id="fileAttachement"
                                                    />
                                                </label>
                                            </Col>
                                        </Row>
                                }

                                <Form.Group as={Row} controlId="formGridReceivedAt">
                                    <Form.Label column sm={7}>Data do recebimento</Form.Label>
                                    <Col sm={5}>
                                        <Form.Control
                                            type="date"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.received_at}
                                            name="received_at"
                                            isInvalid={!!errors.received_at && touched.received_at}
                                        />
                                        <Form.Control.Feedback type="invalid">{touched.received_at && errors.received_at}</Form.Control.Feedback>
                                    </Col>
                                </Form.Group>
                            </Modal.Body>
                            <Modal.Footer>
                                {
                                    messageShowNewAttachment ? (
                                        isUploading ? <CircularProgressbar
                                            styles={{
                                                root: { width: 50 },
                                                path: { stroke: "#069140" },
                                                text: {
                                                    fontSize: "30px",
                                                    fill: "#069140"
                                                },
                                            }}
                                            strokeWidth={12}
                                            value={uploadingPercentage}
                                            text={`${uploadingPercentage}%`}
                                        /> :
                                            <AlertMessage status={typeMessage} />
                                    ) :
                                        <>
                                            <Button variant="secondary" onClick={handleCloseModalEdit}>Cancelar</Button>
                                            <Button variant="success" type="submit">Salvar</Button>
                                        </>

                                }
                            </Modal.Footer>
                        </Form>
                    )}
                </Formik>
            </Modal>
        </>
    )
}

export default AttachmentsRequired;