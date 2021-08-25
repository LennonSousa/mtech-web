import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Image, InputGroup, Form, ListGroup, Modal, Row } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import Incomings, { Income } from '../../../components/Incomings';
import { PayType } from '../../../components/PayTypes';
import { PageWaiting } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';
import { prettifyCurrency } from '../../../components/InputMask/masks';

export default function IncomingsPage() {
    const router = useRouter();
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [incomings, setIncomings] = useState<Income[]>([]);
    const [payTypes, setPayTypes] = useState<PayType[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<statusModal>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [showModalEdit, setShowModalEdit] = useState(false);

    const handleCloseModalEdit = () => setShowModalEdit(false);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const validationSchema = Yup.object().shape({
        description: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
        value: Yup.string().required('Obrigatório!'),
        project: Yup.string().notRequired().nullable(),
        payType: Yup.string().required('Obrigatório!'),
    });

    useEffect(() => {
        handleItemSideBar('finances');
        handleSelectedMenu('finances-incomings');

        if (user && can(user, "finances", "read:any")) {
            api.get('incomings').then(res => {
                api.get('payments/types').then(payTypesRes => {
                    setPayTypes(payTypesRes.data);

                    setIncomings(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get attachmentsRequired to edit, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                });
            }).catch(err => {
                console.log('Error to get attachmentsRequired to edit, ', err);

                setTypeLoadingMessage("error");
                setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
            });
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleListIncomings() {
        const res = await api.get('incomings');

        setIncomings(res.data);
    }

    async function goNewIncome() {
        router.push('/finances/incomings/new');
    }

    return (
        <>
            <NextSeo
                title="Lista de receitas"
                description="Lista de receitas da plataforma de gerenciamento da Mtech Solar."
                openGraph={{
                    url: 'https://app.mtechsolar.com.br',
                    title: 'Lista de receitas',
                    description: 'Lista de receitas da plataforma de gerenciamento da Mtech Solar.',
                    images: [
                        {
                            url: 'https://app.mtechsolar.com.br/assets/images/logo-mtech.jpg',
                            alt: 'Lista de receitas | Plataforma Mtech Solar',
                        },
                        { url: 'https://app.mtechsolar.com.br/assets/images/logo-mtech.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "finances", "read:any") ? <Container className="content-page">
                                {
                                    can(user, "finances", "create") && <Row>
                                        <Col>
                                            <Button variant="outline-success" onClick={goNewIncome}>
                                                <FaPlus /> Criar um receita
                                            </Button>
                                        </Col>
                                    </Row>
                                }

                                <article className="mt-3">
                                    {
                                        loadingData ? <PageWaiting
                                            status={typeLoadingMessage}
                                            message={textLoadingMessage}
                                        /> :
                                            <Row>
                                                {
                                                    user && !!incomings.length ? <Col>
                                                        <ListGroup>
                                                            {
                                                                incomings && incomings.map((income, index) => {
                                                                    return <Incomings
                                                                        key={index}
                                                                        income={income}
                                                                        handleListIncomings={handleListIncomings}
                                                                    />
                                                                })
                                                            }
                                                        </ListGroup>
                                                    </Col> :
                                                        <Col>
                                                            <Row>
                                                                <Col className="text-center">
                                                                    <p style={{ color: 'var(--gray)' }}>Nenhum receita registrada.</p>
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

                                <Formik
                                    initialValues={
                                        {
                                            description: '',
                                            value: '0,00',
                                            payType: '',
                                        }
                                    }
                                    onSubmit={async values => {
                                        setTypeMessage("waiting");
                                        setMessageShow(true);

                                        try {
                                            await api.put('incomings', {
                                                description: values.description,
                                                value: prettifyCurrency(String(values.value)),
                                                payType: values.payType,
                                            });

                                            await handleListIncomings();

                                            setTypeMessage("success");

                                            setTimeout(() => {
                                                setMessageShow(false);
                                                handleCloseModalEdit();
                                            }, 1000);
                                        }
                                        catch (err) {
                                            console.log('error create income.');
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
                                                <Form.Group className="mb-3" controlId="incomeFormGridDescription">
                                                    <Form.Label>Descrição</Form.Label>
                                                    <Form.Control
                                                        placeholder="Descrição da despesa"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.description}
                                                        name="description"
                                                        isInvalid={!!errors.description && touched.description}
                                                    />
                                                    <Form.Control.Feedback type="invalid">{touched.description && errors.description}</Form.Control.Feedback>
                                                    <Form.Text className="text-muted text-right">{`${values.description.length}/50 caracteres.`}</Form.Text>
                                                </Form.Group>

                                                <Row className="mb-3">
                                                    <Form.Group as={Col} sm={3} controlId="formGridValue">
                                                        <Form.Label>Valor</Form.Label>
                                                        <InputGroup className="mb-2">
                                                            <InputGroup.Text id="btnGroupValue">R$</InputGroup.Text>
                                                            <Form.Control
                                                                type="text"
                                                                onChange={(e) => {
                                                                    setFieldValue('value', prettifyCurrency(e.target.value));
                                                                }}
                                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                    setFieldValue('value', prettifyCurrency(e.target.value));
                                                                }}
                                                                value={values.value}
                                                                name="value"
                                                                isInvalid={!!errors.value && touched.value}
                                                                aria-label="Valor do projeto"
                                                                aria-describedby="btnGroupValue"
                                                            />
                                                        </InputGroup>
                                                        <Form.Control.Feedback type="invalid">{touched.value && errors.value}</Form.Control.Feedback>
                                                    </Form.Group>

                                                    <Form.Group as={Col} sm={5} controlId="formGridPayType">
                                                        <Form.Label>Forma de pagamento</Form.Label>
                                                        <Form.Control
                                                            as="select"
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            value={values.payType}
                                                            name="payType"
                                                            isInvalid={!!errors.payType && touched.payType}
                                                        >
                                                            <option hidden>...</option>
                                                            {
                                                                payTypes.map((payType, index) => {
                                                                    return <option key={index} value={payType.id}>{payType.name}</option>
                                                                })
                                                            }
                                                        </Form.Control>
                                                        <Form.Control.Feedback type="invalid">{touched.payType && errors.payType}</Form.Control.Feedback>
                                                    </Form.Group>
                                                </Row>
                                            </Modal.Body>
                                            <Modal.Footer>
                                                {
                                                    messageShow ? <AlertMessage status={typeMessage} /> :
                                                        <>
                                                            <Button variant="secondary" onClick={handleCloseModalEdit}>Cancelar</Button>
                                                            <Button variant="success" type="submit">Salvar</Button>
                                                        </>

                                                }
                                            </Modal.Footer>
                                        </Form>
                                    )}
                                </Formik>
                            </Container> :
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