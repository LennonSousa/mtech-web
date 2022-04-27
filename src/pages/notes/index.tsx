import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';

import api from '../../api/api';
import { TokenVerify } from '../../utils/tokenVerify';
import { AuthContext } from '../../contexts/AuthContext';
import { SideBarContext } from '../../contexts/SideBarContext';
import { Note } from '../../components/Notes';
import NoteItem from '../../components/NoteListItem';
import { NoteItemShimmer } from '../../components/Interfaces/NoteItemShimmer';
import { PageWaiting, PageType } from '../../components/PageWaiting';

const Notes: NextPage = () => {
    const router = useRouter();

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [notes, setNotes] = useState<Note[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    useEffect(() => {
        handleItemSideBar('notes');
        handleSelectedMenu('notes-index');

        api.get('notes').then(res => {
            setNotes(res.data);

            setLoadingData(false);
        }).catch(err => {
            console.log('Error to get notes, ', err);

            setTypeLoadingMessage("error");
            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <>
            <NextSeo
                title="Lista de anotações"
                description="Lista de anotações da plataforma de gerenciamento da Plataforma solar."
                openGraph={{
                    url: process.env.NEXT_PUBLIC_API_URL,
                    title: 'Lista de anotações',
                    description: 'Lista de anotações da plataforma de gerenciamento da Plataforma solar.',
                    images: [
                        {
                            url: `${process.env.NEXT_PUBLIC_API_URL}/assets/images/logo.jpg`,
                            alt: 'Lista de anotações | Plataforma solar',
                        },
                        { url: `${process.env.NEXT_PUBLIC_API_URL}/assets/images/logo.jpg` },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <Container className="page-container">
                        <Row>
                            {
                                loadingData ? <>
                                    {
                                        typeLoadingMessage === "error" ? <PageWaiting
                                            status={typeLoadingMessage}
                                            message={textLoadingMessage}
                                        /> :
                                            <>
                                                <Row className="mt-3">
                                                    <Col className="col-row">
                                                        <Button
                                                            variant="success"
                                                            title="Criar uma anotação."
                                                        >
                                                            <FaPlus />
                                                        </Button>
                                                    </Col>
                                                </Row>

                                                <NoteItemShimmer />
                                            </>
                                    }
                                </> :
                                    <Col>
                                        <Row className="mt-3">
                                            <Col className="col-row">
                                                <Button
                                                    variant="success"
                                                    title="Criar uma anotação."
                                                    onClick={() => handleRoute('/notes/new')}
                                                >
                                                    <FaPlus />
                                                </Button>
                                            </Col>
                                        </Row>

                                        <Row>
                                            {
                                                !!notes.length ? notes.map((note, index) => {
                                                    return <NoteItem key={index} note={note} />
                                                }) :
                                                    <PageWaiting status="empty" message="Nenhum anotação registrada." />
                                            }
                                        </Row>
                                    </Col>
                            }
                        </Row>
                    </Container>
            }
        </>
    )
}

export default Notes;

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