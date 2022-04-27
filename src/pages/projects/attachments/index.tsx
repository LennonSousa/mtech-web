import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button, Col, Container, Form, Image, ListGroup, Modal, Row } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';
import produce from 'immer';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import AttachmentsRequiredProject, { AttachmentRequired } from '../../../components/AttachmentsRequiredProject';
import { PageWaiting } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';

const validationSchema = Yup.object().shape({
    description: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    order: Yup.number().required(),
    active: Yup.boolean().notRequired(),
});

const AttachmentsRequired: NextPage = () => {
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [attachmentsRequiredProject, setAttachmentsRequiredProject] = useState<AttachmentRequired[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<statusModal>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Carregando...');

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [showModalNewItem, setShowModalNewItem] = useState(false);

    const handleCloseModalLine = () => setShowModalNewItem(false);
    const handleShowModalNewItem = () => setShowModalNewItem(true);

    useEffect(() => {
        handleItemSideBar('projects');
        handleSelectedMenu('projects-attachments-required');

        if (user) {
            if (can(user, "settings", "read:any")) {
                api.get('attachments-required/project').then(res => {
                    setAttachmentsRequiredProject(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get attachments-required, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                });
            }
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleListAttachmentsRequired() {
        const res = await api.get('attachments-required/project');

        setAttachmentsRequiredProject(res.data);
    }

    function handleOnDragEnd(result: DropResult) {
        if (result.destination) {
            const from = result.source.index;
            const to = result.destination.index;

            const updatedListDocs = produce(attachmentsRequiredProject, draft => {
                if (draft) {
                    const dragged = draft[from];

                    draft.splice(from, 1);
                    draft.splice(to, 0, dragged);
                }
            });

            if (updatedListDocs) {
                setAttachmentsRequiredProject(updatedListDocs);
                saveOrder(updatedListDocs);
            }
        }
    }

    async function saveOrder(list: AttachmentRequired[]) {
        list.forEach(async (doc, index) => {
            try {
                await api.put(`attachments-required/project/${doc.id}`, {
                    description: doc.description,
                    order: index
                });

                handleListAttachmentsRequired();
            }
            catch (err) {
                console.log('error to save attachments-required order');
                console.log(err)
            }
        });
    }

    return (
        <>
            <NextSeo
                title="Lista de anexos obrigatórios dos projetos"
                description="Lista de anexos obrigatórios dos projetos da plataforma de gerenciamento da Plataforma solar."
                openGraph={{
                    url: process.env.NEXT_PUBLIC_API_URL,
                    title: 'Lista de anexos obrigatórios dos projetos',
                    description: 'Lista de anexos obrigatórios dos projetos da plataforma de gerenciamento da Plataforma solar.',
                    images: [
                        {
                            url: `${process.env.NEXT_PUBLIC_API_URL}/assets/images/logo.jpg`,
                            alt: 'Lista de anexos obrigatórios dos projetos | Plataforma solar',
                        },
                        { url: `${process.env.NEXT_PUBLIC_API_URL}/assets/images/logo.jpg` },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> : <>
                    {
                        can(user, "settings", "read:any") ? <Container className="content-page">
                            <Row>
                                <Col>
                                    {
                                        can(user, "settings", "create") && <Button variant="outline-success" onClick={handleShowModalNewItem}>
                                            <FaPlus /> Criar um item
                                        </Button>
                                    }
                                </Col>
                            </Row>

                            <article className="mt-3">
                                {
                                    loadingData ? <Col>
                                        <Row>
                                            <Col>
                                                <AlertMessage status={typeLoadingMessage} message={textLoadingMessage} />
                                            </Col>
                                        </Row>

                                        {
                                            typeLoadingMessage === "error" && <Row className="justify-content-center mt-3 mb-3">
                                                <Col sm={3}>
                                                    <Image src="/assets/images/undraw_server_down_s4lk.svg" alt="Erro de conexão." fluid />
                                                </Col>
                                            </Row>
                                        }
                                    </Col> :
                                        <Row>
                                            {
                                                !!attachmentsRequiredProject.length ? <Col>
                                                    <DragDropContext onDragEnd={handleOnDragEnd}>
                                                        <Droppable droppableId="attachments-required">
                                                            {provided => (
                                                                <div
                                                                    {...provided.droppableProps}
                                                                    ref={provided.innerRef}
                                                                >
                                                                    <ListGroup>
                                                                        {
                                                                            attachmentsRequiredProject && attachmentsRequiredProject.map((attachmentRequired, index) => {
                                                                                return <Draggable key={attachmentRequired.id} draggableId={attachmentRequired.id} index={index}>
                                                                                    {(provided) => (
                                                                                        <div
                                                                                            {...provided.draggableProps}
                                                                                            {...provided.dragHandleProps}
                                                                                            ref={provided.innerRef}
                                                                                        >
                                                                                            <AttachmentsRequiredProject
                                                                                                attachmentRequired={attachmentRequired}
                                                                                                listAttachmentsRequired={attachmentsRequiredProject}
                                                                                                handleListAttachmentsRequired={handleListAttachmentsRequired}
                                                                                            />
                                                                                        </div>
                                                                                    )}

                                                                                </Draggable>
                                                                            })
                                                                        }
                                                                    </ListGroup>
                                                                    {provided.placeholder}
                                                                </div>
                                                            )}
                                                        </Droppable>
                                                    </DragDropContext>
                                                </Col> :
                                                    <Col>
                                                        <Row>
                                                            <Col className="text-center">
                                                                <p style={{ color: 'var(--gray)' }}>Nenhum anexo obrigatório registrado.</p>
                                                            </Col>
                                                        </Row>

                                                        <Row className="justify-content-center mt-3 mb-3">
                                                            <Col sm={3}>
                                                                <Image src="/assets/images/undraw_not_found.svg" alt="Sem dados para mostrar." fluid />
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                            }
                                        </Row>
                                }
                            </article>

                            <Modal show={showModalNewItem} onHide={handleCloseModalLine}>
                                <Modal.Header closeButton>
                                    <Modal.Title>Criar um item</Modal.Title>
                                </Modal.Header>
                                <Formik
                                    initialValues={
                                        {
                                            description: '',
                                            active: true,
                                            order: 0,
                                        }
                                    }
                                    onSubmit={async values => {
                                        setTypeMessage("waiting");
                                        setMessageShow(true);

                                        try {
                                            if (attachmentsRequiredProject) {
                                                await api.post('attachments-required/project', {
                                                    description: values.description,
                                                    active: values.active,
                                                    order: attachmentsRequiredProject.length,
                                                });

                                                await handleListAttachmentsRequired();

                                                setTypeMessage("success");

                                                setTimeout(() => {
                                                    setMessageShow(false);
                                                    handleCloseModalLine();
                                                }, 1500);
                                            }
                                        }
                                        catch (err) {
                                            setTypeMessage("error");

                                            setTimeout(() => {
                                                setMessageShow(false);
                                            }, 4000);

                                            console.log('error create project line.');
                                            console.log(err);
                                        }

                                    }}
                                    validationSchema={validationSchema}
                                >
                                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                                        <Form onSubmit={handleSubmit}>
                                            <Modal.Body>
                                                <Form.Group controlId="lineFormGridName">
                                                    <Form.Label>Nome do anexo obrigatório</Form.Label>
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
                                                            <Button variant="secondary" onClick={handleCloseModalLine}>
                                                                Cancelar
                                                            </Button>
                                                            <Button variant="success" type="submit">Salvar</Button>
                                                        </>

                                                }
                                            </Modal.Footer>
                                        </Form>
                                    )}
                                </Formik>
                            </Modal>
                        </Container> :
                            <PageWaiting status="warning" message="Acesso negado!" />
                    }
                </>
            }
        </>
    )
}

export default AttachmentsRequired;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { token } = context.req.cookies;

    const tokenVerified = await TokenVerify(token);

    if (tokenVerified === "not-authorized") { // Not authenticated, token invalid!
        return {
            redirect: {
                destination: `/?returnto=${context.req.url}`,
                permanent: false,
            },
        }
    }

    if (tokenVerified === "error") { // Server error!
        return {
            redirect: {
                destination: '/500',
                permanent: false,
            },
        }
    }

    return {
        props: {},
    }
}