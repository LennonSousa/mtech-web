import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Image, ListGroup, Row } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import Panels, { Panel } from '../../../components/Panels';
import { PageWaiting } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';

export default function PanelsPage() {
    const router = useRouter();
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [panels, setPanels] = useState<Panel[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<statusModal>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Carregando...');

    useEffect(() => {
        handleItemSideBar('estimates');
        handleSelectedMenu('estimates-panels');

        if (user && can(user, "estimates", "view")) {
            api.get('panels').then(res => {
                setPanels(res.data);

                setLoadingData(false);
            }).catch(err => {
                console.log('Error to get panels, ', err);

                setTypeLoadingMessage("error");
                setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
            });
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleListPanels() {
        const res = await api.get('panels');

        setPanels(res.data);
    }

    function goNewPanel() {
        router.push('/estimates/panels/new');
    }

    return (
        <>
            <NextSeo
                title="Lista de painéis"
                description="Lista de painéis da plataforma de gerenciamento da Mtech Solar."
                openGraph={{
                    url: 'https://app.mtechsolar.com.br',
                    title: 'Lista de painéis',
                    description: 'Lista de painéis da plataforma de gerenciamento da Mtech Solar.',
                    images: [
                        {
                            url: 'https://app.mtechsolar.com.br/assets/images/logo-mtech.jpg',
                            alt: 'Lista de painéis | Plataforma Mtech Solar',
                        },
                        { url: 'https://app.mtechsolar.com.br/assets/images/logo-mtech.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "estimates", "view") ? <Container className="content-page">
                                {
                                    can(user, "estimates", "create") && <Row>
                                        <Col>
                                            <Button variant="outline-success" onClick={goNewPanel}>
                                                <FaPlus /> Criar um painel
                                            </Button>
                                        </Col>
                                    </Row>
                                }

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
                                                    user && !!panels.length ? <Col>
                                                        <ListGroup>
                                                            {
                                                                panels && panels.map((panel, index) => {
                                                                    return <Panels
                                                                        key={index}
                                                                        panel={panel}
                                                                        handleListPanels={handleListPanels}
                                                                    />
                                                                })
                                                            }
                                                        </ListGroup>
                                                    </Col> :
                                                        <Col>
                                                            <Row>
                                                                <Col className="text-center">
                                                                    <p style={{ color: 'var(--gray)' }}>Nenhum painel registrado.</p>
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