import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, ListGroup, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaKey } from 'react-icons/fa';

import api from '../../../../api/api';
import { TokenVerify } from '../../../../utils/tokenVerify';
import { SideBarContext } from '../../../../contexts/SideBarContext';
import { AuthContext } from '../../../../contexts/AuthContext';
import { can } from '../../../../components/Users';
import { Panel } from '../../../../components/Panels';
import PageBack from '../../../../components/PageBack';
import { AlertMessage, statusModal } from '../../../../components/interfaces/AlertMessage';
import { PageWaiting, PageType } from '../../../../components/PageWaiting';

interface userRoles {
    role: string,
    grants: string[],
};

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    capacity: Yup.number().notRequired(),
    paused: Yup.boolean().notRequired(),
    order: Yup.number().required('Obrigatório!'),
});

export default function NewUser() {
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [panels, setPanels] = useState<Panel[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');
    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const router = useRouter();

    useEffect(() => {
        handleItemSideBar('estimates');
        handleSelectedMenu('estimates-panels');

        if (user) {
            if (can(user, "estimates", "update:any")) {

                api.get('panels').then(res => {
                    setPanels(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get panels, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                });
            }
        }
    }, [user]);

    return (
        <>
            <NextSeo
                title="Criar usuário"
                description="Criar usuário da plataforma de gerenciamento da Bioma consultoria."
                openGraph={{
                    url: 'https://app.biomaconsultoria.com',
                    title: 'Criar usuário',
                    description: 'Criar usuário da plataforma de gerenciamento da Bioma consultoria.',
                    images: [
                        {
                            url: 'https://app.biomaconsultoria.com/assets/images/logo-bioma.jpg',
                            alt: 'Criar usuário | Plataforma Bioma',
                        },
                        { url: 'https://app.biomaconsultoria.com/assets/images/logo-bioma.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "users", "create") ? <>
                                {
                                    loadingData ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <Container className="content-page">
                                            <Formik
                                                initialValues={{
                                                    name: '',
                                                    capacity: 0,
                                                    paused: false,
                                                    order: 0,
                                                }}
                                                onSubmit={async values => {
                                                    setTypeMessage("waiting");
                                                    setMessageShow(true);

                                                    try {

                                                        await api.post('panels', {
                                                            name: values.name,
                                                            capacity: values.capacity,
                                                            order: panels.length,
                                                        });

                                                        setTypeMessage("success");

                                                        setTimeout(() => {
                                                            router.push('/panels');
                                                        }, 1500);
                                                    }
                                                    catch {
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
                                                        <Row className="mb-3">
                                                            <Col>
                                                                <PageBack href="/users" subTitle="Voltar para a lista de usuários." />
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} sm={8} controlId="formGridName">
                                                                <Form.Label>Nome</Form.Label>
                                                                <Form.Control
                                                                    type="name"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.name}
                                                                    name="name"
                                                                    isInvalid={!!errors.name && touched.name}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                                                <Form.Text className="text-muted text-right">{`${values.name.length}/50 caracteres.`}</Form.Text>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridEmail">
                                                                <Form.Label>Capacidade</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.capacity}
                                                                    name="capacity"
                                                                    isInvalid={!!errors.capacity && touched.capacity}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.capacity && errors.capacity}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="justify-content-end">
                                                            {
                                                                messageShow ? <Col sm={3}><AlertMessage status={typeMessage} /></Col> :
                                                                    <Col className="col-row">
                                                                        <Button variant="success" type="submit">Salvar</Button>
                                                                    </Col>

                                                            }
                                                        </Row>
                                                    </Form>
                                                )}
                                            </Formik>
                                        </Container >
                                }
                            </> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

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