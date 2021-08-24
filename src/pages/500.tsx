import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { Col, Container, Image, Row } from 'react-bootstrap';
import { FaArrowRight } from 'react-icons/fa';

import { AlertMessage } from '../components/faces/AlertMessage';

export default function Page500() {
  return (
    <>
      <NextSeo
        title="Erro interno"
        description="Erro interno da plataforma de gerenciamento da Mtech Solar."
        openGraph={{
          url: 'https://app.mtechsolar.com',
          title: 'Erro interno',
          description: 'Erro interno da plataforma de gerenciamento da Mtech Solar.',
          images: [
            {
              url: 'https://app.mtechsolar.com/assets/images/logo-mtech.jpg',
              alt: 'Erro interno | Plataforma Mtech Solar',
            },
            { url: 'https://app.mtechsolar.com/assets/images/logo-mtech.jpg' },
          ],
        }}
      />

      <article>
        <Container className="content-page">
          <Row className="justify-content-center text-center mt-3">
            <Col>
              <h2 className="article-title">Erro de conexão!</h2>
            </Col>
          </Row>

          <Row className="justify-content-center mt-3">
            <Col sm={7} className="article-text">
              <AlertMessage status={"error"} message="Algo de errado aconteceu entre você e o servidor." />
            </Col>
          </Row>

          <Row className="justify-content-center text-center mt-3">
            <Col>
              <Link href='/'>
                <a>
                  Clique aqui para voltar à página inicial <FaArrowRight size={18} />
                </a>
              </Link>
            </Col>
          </Row>

          <Row className="justify-content-center mt-5 mb-5">
            <Col sm={5}>
              <Image fluid rounded src="/assets/images/undraw_server_down_s4lk.svg" alt="Página não encontrada." />
            </Col>
          </Row>
        </Container>
      </article>
    </>
  )
}