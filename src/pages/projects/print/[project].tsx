import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Col, Container, Button, ButtonGroup, Image, Row, Table } from 'react-bootstrap';
import { format } from 'date-fns';
import br from 'date-fns/locale/pt-BR';
import {
    FaClipboardList,
    FaPencilAlt,
} from 'react-icons/fa';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import { Project } from '../../../components/Projects';
import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { prettifyCurrency } from '../../../components/InputMask/masks';
import { PrintButton } from '../../../components/Interfaces/PrintButton';
import { getHtml } from '../../../utils/textEditor';

const ProjectPrint: NextPage = () => {
    const router = useRouter();
    const { project } = router.query;

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [data, setData] = useState<Project>();
    const [documentType, setDocumentType] = useState("CPF");

    const [isAuthorized, setIsAuthorized] = useState(true);

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    useEffect(() => {
        if (user) {
            handleItemSideBar('projects');
            handleSelectedMenu('projects-index');

            if (can(user, "projects", "read:any") || can(user, "projects", "read:own")) {
                if (project) {
                    api.get(`projects/${project}`, {
                        validateStatus: function (status) {
                            return status < 500; // Resolve only if the status code is less than 500
                        }
                    }).then(res => {
                        switch (res.status) {
                            case 200:
                                const projectRes: Project = res.data;

                                if (projectRes.document.length > 14)
                                    setDocumentType("CNPJ");

                                setData(res.data);

                                setLoadingData(false);
                                break;
                            case 403:
                                setIsAuthorized(false);
                                break;
                            default:
                                setTypeLoadingMessage("error");
                                setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                                setHasErrors(true);
                        }
                    }).catch(err => {
                        console.log('Error to get project: ', err);

                        setTypeLoadingMessage("error");
                        setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                        setHasErrors(true);
                    });
                }
            }
        }
    }, [user, project]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <>
            <NextSeo
                title="Imprimir projeto"
                description="Imprimir projeto da plataforma de gerenciamento da Plataforma solar."
                openGraph={{
                    url: process.env.NEXT_PUBLIC_API_URL,
                    title: 'Imprimir projeto',
                    description: 'Imprimir projeto da plataforma de gerenciamento da Plataforma solar.',
                    images: [
                        {
                            url: `${process.env.NEXT_PUBLIC_API_URL}/assets/images/logo.jpg`,
                            alt: 'Imprimir projeto | Plataforma solar',
                        },
                        { url: `${process.env.NEXT_PUBLIC_API_URL}/assets/images/logo.jpg` },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            isAuthorized ? <>
                                {
                                    loadingData || hasErrors ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <>
                                            {
                                                !data ? <PageWaiting status="waiting" /> :
                                                    <Container className="content-page">
                                                        <Row>
                                                            <Col style={{ fontSize: '1.2rem' }}>
                                                                <Row className="mb-3 d-print-none">
                                                                    <Col>
                                                                        <PageBack href={`/projects/details/${data.id}`} subTitle="Voltar para os detalhes da projeto" />
                                                                    </Col>

                                                                    <Col className="col-row">
                                                                        <ButtonGroup className="col-12">
                                                                            <Button
                                                                                title="Editar projeto."
                                                                                variant="success"
                                                                                onClick={() => handleRoute(`/projects/edit/${data.id}`)}
                                                                            >
                                                                                <FaPencilAlt />
                                                                            </Button>
                                                                        </ButtonGroup>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col className="col-3">
                                                                        <Image fluid src={data.store.avatar} alt={data.store.title} />
                                                                    </Col>
                                                                </Row>

                                                                <Row className="text-center">
                                                                    <Col>
                                                                        <h4 className="text-dark text-wrap"><b>CONTRATO DE IMPLEMENTAÇÃO FOTOVOLTAICA</b></h4>
                                                                    </Col>
                                                                </Row>

                                                                <p className="text-secondary text-wrap">
                                                                    A empresa {data.store.name},{` `}
                                                                    CNPJ {data.store.document} denominada, <b>CONTRATADA</b>,
                                                                    com sede na {data.store.street} - N° {data.store.number}, {data.store.neighborhood}
                                                                    na cidade de {data.store.city} - {data.store.state}.
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    E por outro lado {data.customer}, {documentType}: {data.document}, endereço:{` `}
                                                                    {data.street}, Nº {data.number}, {data.neighborhood}, {data.city} – {data.state}, denominada <b>CONTRATANTE</b>,
                                                                    mediante o presente contrato têm entre si justo o presente instrumento
                                                                    particular de Contrato de Compra de um sistema fotovoltaico
                                                                    de <b>{`${prettifyCurrency(Number(data.capacity).toFixed(2))} kWp`}</b>,
                                                                    que mutuamente outorgam e aceitam, de acordo com os artigos 481 a 504
                                                                    do Novo Código Civil e cláusulas e condições a seguir: DO OBJETO
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    I.1.	Pelo presente Contrato, a CONTRATADA compromete-se e obriga-se a vender à CONTRATANTE,
                                                                    que por este ato obriga-se e compromete-se a vender um sistema fotovoltaico por encomenda,
                                                                    previamente identificados através de pedido ajustado entre as partes, e anexado ao presente.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    I.2.	A CONTRATADA assegura à CONTRATANTE que o sistema fotovoltaico estará em conformidade
                                                                    com as especificações técnicas e necessárias acordadas, conforme pedido ajustado por ambas
                                                                    as partes, e que os referidos bens, serão inicialmente de propriedade única da <b>CONTRATANTE</b>.
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    II.	DO PREÇO DO CONTRATO
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    A CONTRATANTE compromete-se a pagar à CONTRATADA a quantia de{` `}
                                                                    <b>{`R$ ${Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(data.price)}`}</b>,
                                                                    nesta data de acordo com o sistema fotovoltaico,
                                                                    o pagamento do mesmo será financiado pela financeira SOLFÁCIL.
                                                                </p>


                                                                <p className="text-secondary text-wrap">
                                                                    DO PAGAMENTO
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    A quantia devida pela CONTRATANTE à CONTRATADA será paga para pagamento da aquisição
                                                                    e deve ser realizada exclusivamente em nome da contratada, através de transferências
                                                                    ou depósito para a CONTRATADA.
                                                                </p>

                                                                <p
                                                                    className="text-secondary text-wrap"
                                                                    dangerouslySetInnerHTML={{ __html: getHtml(data.store.bank_account) }}
                                                                >
                                                                </p>

                                                                <Col className="border-top mb-3"></Col>

                                                                <Row className="justify-content-center align-items-center text-center mb-3">
                                                                    <Col sm={9}>
                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{data.store.title}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{`${data.store.street}, ${data.store.number} - ${data.store.neighborhood}`}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{data.store.complement}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{`${data.store.zip_code}, ${data.store.city} - ${data.store.state}`}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{`${data.store.phone}, ${data.store.email}`}</small>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col style={{ pageBreakBefore: 'always' }} className="border-top mt-1 mb-3"></Col>

                                                                <Row className="justify-content-center">
                                                                    <Col className="col-3">
                                                                        <Image fluid src={data.store.avatar} alt={data.store.title} />
                                                                    </Col>
                                                                </Row>

                                                                <p className="text-secondary text-wrap">
                                                                    <b>RESPONSABILIDADES DA CONTRATANTE</b>
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    II.1.	Efetuar o pagamento, à CONTRATADA, da quantia devida pela aquisição dos produtos/mercadorias,
                                                                    nos termos das cláusulas 1, 2 e 3 do presente Contrato; VIA CONTA BANCÁRIA JURIDICA DA CONTRATADA.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    II.2.	Uma vez realizado o pagamento, os produtos/mercadorias, de acordo com a cláusula 1,
                                                                    obriga-se a CONTRATANTE a recebê-las da CONTRATADA, que por sua vez a ela se obriga entregá-las,
                                                                    sob as condições pactuadas neste instrumento;
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    <b>III.	RESPONSABILIDADE DA CONTRATADA:</b>
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    III.1.	Efetuar a operação de venda dos produtos/mercadorias por encomenda nas condições estabelecidas
                                                                    entre a CONTRATADA e a CONTRATANTE, em observância à cláusula 1;
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    III.2.	Providenciar perante as pessoas jurídicas responsáveis, tempestivamente, o envio de todos
                                                                    os documentos pertinentes à aquisição dos produtos/mercadorias.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    III.3.	Responder por eventuais irregularidades dos produtos/mercadorias a serem adquiridos,
                                                                    bem como, responsabilizar-se integralmente pela qualidade e quantidade dos produtos/mercadorias,
                                                                    conferindo-as com as especificações conforme negociação com os Fornecedor, fisicamente e documentalmente.
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    <b>IV.	PRAZO PARA IMPLEMENTAÇÃO DE SISTEMA</b>
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    IV.1.	O Prazo regulatório de entrega do sistema fotovoltaico para conectar a rede são de 38 dias úteis
                                                                    pela concessionária local, a partir da nova resolução 687 ANEEL, porém, caso a concessionária aponte obra ou
                                                                    falte medidor, o prazo de entrega será conforme estipulado pela mesma, podendo ser até 180 dias.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    IV.2.	Considerando todos trâmites burocráticos de registros na concessionária de Energia conforme
                                                                    RES 482 Aneel, informado no item.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    IV.3.	O Prazo de CONCLUSÃO DA OBRA POR PARTE DA CONTRATADA SÃO de até 180 dias após a data de pagamento acordado.
                                                                    Tempo de entrega acordados necessários para compra de materiais, instalações, engenharia e tempo de trabalhos necessários.
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    <b>V.	GARANTIA DE PRODUÇÃO SFCR</b>
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    Para o sistema fotovoltaico conectado rede (SFCR) ora contratado, é garantida a produção energética em condições
                                                                    ótimas de irradiação de{` `}
                                                                    <b>
                                                                        {
                                                                            `${prettifyCurrency(
                                                                                ((Number(data.months_average) + Number(data.average_increase)) * 12)
                                                                                    .toFixed(2))} (Quilowatt hora por ano)`
                                                                        }
                                                                    </b>.
                                                                    Entende-se por condições ótimas de irradiação: Painéis fotovoltaicos alinhados com sua face para o norte, ausência
                                                                    de sujeira acumulada nos painéis, ausência de sombreamento originado de construções ou objetos diversos
                                                                    (exemplo: antenas, condensadores de ar condicionado, muros ou mesmo arvores vizinhas ao local), que possam
                                                                    vir a causar obstrução na irradiação solar direta ao longo do dia.
                                                                </p>

                                                                <Col className="border-top mb-3"></Col>

                                                                <Row className="justify-content-center align-items-center text-center mb-3">
                                                                    <Col sm={9}>
                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{data.store.title}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{`${data.store.street}, ${data.store.number} - ${data.store.neighborhood}`}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{data.store.complement}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{`${data.store.zip_code}, ${data.store.city} - ${data.store.state}`}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{`${data.store.phone}, ${data.store.email}`}</small>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col style={{ pageBreakBefore: 'always' }} className="border-top mt-1 mb-3"></Col>

                                                                <Row className="justify-content-center">
                                                                    <Col className="col-3">
                                                                        <Image fluid src={data.store.avatar} alt={data.store.title} />
                                                                    </Col>
                                                                </Row>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    VI.1 O CONTRANTANTE tem ciência e da pleno aceite a possibilidade de oscilações médias de 5% (cinco por cento)
                                                                    na capacidade estimada de produção em Kwh/ano (Quilowatt hora por ano) do sistema fotovoltaico conectado a rede
                                                                    (SFCR) supracitado em virtude de variações climáticas anuais, considerando a manutenção da condição ótima de irradiação.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    VI.2 A CONTRATANTE tem ciência e da pleno aceite ao fato de que podem haver reduções na produção fotovoltaica
                                                                    superiores a 5% (cinco por cento) originadas da inexistência de condições ótimas de irradiação ou por parada
                                                                    do sistema para manutenção, bem como por construções em áreas vizinhas que venham a bloquear a irradiação
                                                                    solar direta ou ainda por redução da capacidade de geração ao longo dos anos, proporcionalmente ao informado
                                                                    pelo fabricante dos painéis solares utilizados, de maneira que estas reduções não originam nenhum tipo de ressarcimento.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    VI.3 O CONTRATANTE tem ciência e da pleno aceite à possiblidade de diferença na medição de produção em KWh/ano
                                                                    entre o sistema fotovoltaico conectado à rede (SFCR) e o medidor de energia da concessionária, sendo utilizado
                                                                    para fins de garantia de produção fotovoltaica a medição realizada pelo próprio INVERSOR do sistema fotovoltaico
                                                                    conectado à rede (SFCR) através de softwares próprios do inversor, de terceiros ou no próprio display do mesmo.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    VI.4 O CONTRATANTE tem ciência e da pleno aceite que para garantia instantânea de produção energética é
                                                                    necessária rede de internet WIFI disponível para a configurações do inversor; e caso haja troca da senha
                                                                    de acesso à internet haverá a necessidade de uma visita técnica para reconfiguração do inversor que custará
                                                                    R$ 100,00 somados a R$ 4,00 o Km quando for necessário sair da cidade de {data.store.city} - {data.store.state}.
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    <b>RESCISÃO DO CONTRATO</b>
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    Após o pagamento dos produtos/mercadorias, este contrato passará a ser irrevogável e irretratável,
                                                                    obrigando ambas as partes em todos os seus termos, atribuindo ao presente Contrato a Força Executiva,
                                                                    ficando todos os custos adicionais de armazenagem dos produtos/mercadorias, sob inteira responsabilidade
                                                                    da CONTRATANTE.
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    <b>VALIDADE DO CONTRATO</b>
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    V.1.	Este Contrato terá validade por tempo indeterminado, até a entrega dos produtos e finalização
                                                                    de processo de compra e venda.
                                                                </p>

                                                                <h5 className="text-dark"><FaClipboardList /> BENS</h5>

                                                                <Table striped hover size="sm" responsive>
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Quantidade</th>
                                                                            <th>Produto</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {
                                                                            data.items.map((item, index) => {
                                                                                return <tr key={index}>
                                                                                    <td>{prettifyCurrency(Number(item.amount).toFixed(2))}</td>
                                                                                    <td>{item.name}</td>
                                                                                </tr>
                                                                            })
                                                                        }
                                                                    </tbody>
                                                                </Table>

                                                                <Col className="border-top mb-3"></Col>

                                                                <Row className="justify-content-center align-items-center text-center mb-3">
                                                                    <Col sm={9}>
                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{data.store.title}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{`${data.store.street}, ${data.store.number} - ${data.store.neighborhood}`}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{data.store.complement}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{`${data.store.zip_code}, ${data.store.city} - ${data.store.state}`}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{`${data.store.phone}, ${data.store.email}`}</small>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col style={{ pageBreakBefore: 'always' }} className="border-top mt-1 mb-3"></Col>

                                                                <Row className="justify-content-center">
                                                                    <Col className="col-3">
                                                                        <Image fluid src={data.store.avatar} alt={data.store.title} />
                                                                    </Col>
                                                                </Row>

                                                                <p className="text-secondary text-wrap">
                                                                    <b>TEMPO DE ENTREGA E INSTALAÇÕES DO SISTEMA. </b>
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    <b>VI.	ENVIO E CONDIÇÕES DE ENTREGA.</b><br />
                                                                    VI.1.	Condições da entrega: CIF Brasil<br />
                                                                    VI.2.	Incluir um conjunto de documentação técnica com instruções, manutenção,
                                                                    com suas respectivas instruções de instalação e uso.<br />
                                                                    VI.3.	Tempo de entrega de até 180 dias de instalação total dos equipamentos.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    <b>VII.	ATRASOS.</b><br />
                                                                    VII.1.	Se a CONTRATADA sofrer qualquer atraso no desempenho devido a causas fora
                                                                    do seu controle, incluindo causas naturais resultantes da lei de Deus, guerra,
                                                                    atos de violência ou omissão por parte dos governos, incêndio, desastre, falha
                                                                    de energia, greves, sabotagem ou atraso na obtenção de permissões, serviços,
                                                                    materiais, ferramentas, componentes necessários para a instalação, falta de
                                                                    transporte, a instalação será alargada a um período de dias iguais ao tempo
                                                                    causado pelo atraso e as suas consequências.  A CONTRATADA dará a CONTRATANTE
                                                                    um aviso num prazo razoável a partir da data em que a empresa tem consciência
                                                                    e pleno conhecimento do referido atraso.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    <b>VIII.	LOCAL DA INSTALAÇÃO DO SISTEMA</b><br />
                                                                    VIII.1.	Os módulos fotovoltaicos serão instalados em área a ser fornecida pelo
                                                                    cliente. Caso seja necessário, realização de reformas para alteração, inclusão
                                                                    de reforços ou quaisquer adequações necessárias para a instalação do sistema,
                                                                    não estão incluídas nesta proposta, sendo objeto de negociação entre as partes,
                                                                    o local estará juntamente com a proforma.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    <b>IX.	GARANTIAS</b><br />
                                                                    IX.1.	Instalação 1 ano.<br />
                                                                    IX.2.	10 anos de garantia pela fabricante, nos módulos fotovoltaicos contra
                                                                    defeito de fabricação direto com a fábrica com o intermédio da contratada, os
                                                                    custos de envio e visita técnica por parte da contratante.<br />
                                                                    IX.3.	Garantia de 25 anos pela fabricante dos módulos fotovoltaicos relativa a
                                                                    Capacidade de geração de energia em até 82% de eficiência direto com a fábrica.
                                                                    Mas os custos de envio e visita técnica por parte da contratante.<br />
                                                                    IX.4.	05 anos de garantia do inversor solar fotovoltaico contra defeito de
                                                                    fabricação direto com a fábrica.<br />
                                                                    IX.5.	15 anos de garantia das estruturas de fixação
                                                                </p>

                                                                <br />
                                                                <br />
                                                                <br />
                                                                <br />
                                                                <br />
                                                                <br />
                                                                <br />
                                                                <br />

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="justify-content-center align-items-center text-center mb-3">
                                                                    <Col sm={9}>
                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{data.store.title}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{`${data.store.street}, ${data.store.number} - ${data.store.neighborhood}`}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{data.store.complement}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{`${data.store.zip_code}, ${data.store.city} - ${data.store.state}`}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{`${data.store.phone}, ${data.store.email}`}</small>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col style={{ pageBreakBefore: 'always' }} className="border-top mt-1 mb-3"></Col>

                                                                <Row className="justify-content-center">
                                                                    <Col className="col-3">
                                                                        <Image fluid src={data.store.avatar} alt={data.store.title} />
                                                                    </Col>
                                                                </Row>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    <b>X.	RESPONSABILIDADE DE INSTALAÇÃO E GARANTIA EM TERRITÓRIO NACIONAL</b><br />
                                                                    X.1.	A CONTRATADA irá atuar como vendedora, e efetuará instalação completa
                                                                    do sistema no local indicado pelo CONTRATANTE, bem como dará posteriormente o
                                                                    suporte pós-venda, e manutenções do sistema dentro da garantia de instalação em
                                                                    todo o território nacional com as garantias do sistema no Brasil para o perfeito
                                                                    funcionamento do gerador
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    <b>XI.	ACEITAÇÃO DE CLÁUSULAS E FINALIZAÇÃO DE CONTRATO</b><br />
                                                                    XI.1.	Desta forma sendo finalizado e formalizada de negociações entre as partes
                                                                    CONTRATADA e CONTRATANTE as partes entre si tem aqui acordado de boa-fé a efetivação
                                                                    de negócios de bens entre as partes cumprindo integralmente com suas responsabilidade
                                                                    e formalidades legais deste contrato. E, por estarem assim justos e acordados,
                                                                    lavram, datam e assinam o presente instrumento juntamente em 2 (Duas) vias de igual
                                                                    teor e forma, obrigando-se por si.<br />
                                                                    XI.2.	Fica eleito o Foro da comarca de Imperatriz- MA como competente para qualquer
                                                                    ação judicial oriunda do presente contrato.<br />
                                                                </p>

                                                                <br />
                                                                <span className="text-secondary text-wrap">{format(new Date(), 'PPPPp', { locale: br })}</span>

                                                                <Row className="mt-5 mb-5">
                                                                    <Col>
                                                                        <span className="text-secondary text-wrap">
                                                                            <b>
                                                                                CONTRATADA:<br />
                                                                                Assinatura:		_________________________________________________<br />
                                                                                Empresa:		{data.store.name}<br />
                                                                                CNPJ:		    {data.store.document}
                                                                            </b>
                                                                        </span>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mt-5 mb-5">
                                                                    <Col>
                                                                        <span className="text-secondary text-wrap">
                                                                            <b>
                                                                                CONTRATANTE:<br />
                                                                                Assinatura:		________________________________________________<br />
                                                                                Representante:  {data.customer}<br />
                                                                                {documentType}: {data.document}
                                                                            </b>
                                                                        </span>
                                                                    </Col>
                                                                </Row>

                                                                <br />
                                                                <br />
                                                                <br />
                                                                <br />
                                                                <br />
                                                                <br />
                                                                <br />

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="justify-content-center align-items-center text-center mb-3">
                                                                    <Col sm={9}>
                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{data.store.title}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{`${data.store.street}, ${data.store.number} - ${data.store.neighborhood}`}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{data.store.complement}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{`${data.store.zip_code}, ${data.store.city} - ${data.store.state}`}</small>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <small className="text-dark">{`${data.store.phone}, ${data.store.email}`}</small>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <PrintButton title="Imprimir projeto." />
                                                    </Container>
                                            }
                                        </>
                                }
                            </> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default ProjectPrint;

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