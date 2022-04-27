import { useContext, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import { Col, Container, Image, ListGroup, Row } from 'react-bootstrap';

import { TokenVerify } from '../../utils/tokenVerify';
import { SideBarContext } from '../../contexts/SideBarContext';
import { AuthContext } from '../../contexts/AuthContext';
import { StoresContext } from '../../contexts/StoresContext';
import { can } from '../../components/Users';
import { Stores } from '../../components/Stores';
import { PageWaiting } from '../../components/PageWaiting';

const StoresPage: NextPage = () => {
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);
    const { stores } = useContext(StoresContext);

    useEffect(() => {
        handleItemSideBar('stores');
        handleSelectedMenu('stores-index');
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            <NextSeo
                title="Lojas"
                description="Lojas da plataforma de gerenciamento da Plataforma solar."
                openGraph={{
                    url: process.env.NEXT_PUBLIC_API_URL,
                    title: 'Lojas',
                    description: 'Lojas da plataforma de gerenciamento da Plataforma solar.',
                    images: [
                        {
                            url: `${process.env.NEXT_PUBLIC_API_URL}/assets/images/logo.jpg`,
                            alt: 'Lojas | Plataforma solar',
                        },
                        { url: `${process.env.NEXT_PUBLIC_API_URL}/assets/images/logo.jpg` },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "store", "read:any") ? <Container className="content-page">
                                <article className="mt-3">
                                    <Row>
                                        {
                                            !!stores.length ? <Col>
                                                <ListGroup>
                                                    {
                                                        stores && stores.map(store => {
                                                            return <Stores
                                                                key={store.id}
                                                                store={store}
                                                                canEdit={can(user, "store", "update:any")}
                                                            />
                                                        })
                                                    }
                                                </ListGroup>
                                            </Col> :
                                                <Col>
                                                    <Row>
                                                        <Col className="text-center">
                                                            <p style={{ color: 'var(--gray)' }}>Nenhuma loja registrada.</p>
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
                                </article>
                            </Container> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default StoresPage;

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