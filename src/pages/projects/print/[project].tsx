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
                                setTextLoadingMessage("N??o foi poss??vel carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                                setHasErrors(true);
                        }
                    }).catch(err => {
                        console.log('Error to get project: ', err);

                        setTypeLoadingMessage("error");
                        setTextLoadingMessage("N??o foi poss??vel carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
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
                                                                        <h4 className="text-dark text-wrap"><b>CONTRATO DE IMPLEMENTA????O FOTOVOLTAICA</b></h4>
                                                                    </Col>
                                                                </Row>

                                                                <p className="text-secondary text-wrap">
                                                                    A empresa {data.store.name},{` `}
                                                                    CNPJ {data.store.document} denominada, <b>CONTRATADA</b>,
                                                                    com sede na {data.store.street} - N?? {data.store.number}, {data.store.neighborhood}
                                                                    na cidade de {data.store.city} - {data.store.state}.
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    E por outro lado {data.customer}, {documentType}: {data.document}, endere??o:{` `}
                                                                    {data.street}, N?? {data.number}, {data.neighborhood}, {data.city} ??? {data.state}, denominada <b>CONTRATANTE</b>,
                                                                    mediante o presente contrato t??m entre si justo o presente instrumento
                                                                    particular de Contrato de Compra de um sistema fotovoltaico
                                                                    de <b>{`${prettifyCurrency(Number(data.capacity).toFixed(2))} kWp`}</b>,
                                                                    que mutuamente outorgam e aceitam, de acordo com os artigos 481 a 504
                                                                    do Novo C??digo Civil e cl??usulas e condi????es a seguir: DO OBJETO
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    I.1.	Pelo presente Contrato, a CONTRATADA compromete-se e obriga-se a vender ?? CONTRATANTE,
                                                                    que por este ato obriga-se e compromete-se a vender um sistema fotovoltaico por encomenda,
                                                                    previamente identificados atrav??s de pedido ajustado entre as partes, e anexado ao presente.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    I.2.	A CONTRATADA assegura ?? CONTRATANTE que o sistema fotovoltaico estar?? em conformidade
                                                                    com as especifica????es t??cnicas e necess??rias acordadas, conforme pedido ajustado por ambas
                                                                    as partes, e que os referidos bens, ser??o inicialmente de propriedade ??nica da <b>CONTRATANTE</b>.
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    II.	DO PRE??O DO CONTRATO
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    A CONTRATANTE compromete-se a pagar ?? CONTRATADA a quantia de{` `}
                                                                    <b>{`R$ ${Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(data.price)}`}</b>,
                                                                    nesta data de acordo com o sistema fotovoltaico,
                                                                    o pagamento do mesmo ser?? financiado pela financeira SOLF??CIL.
                                                                </p>


                                                                <p className="text-secondary text-wrap">
                                                                    DO PAGAMENTO
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    A quantia devida pela CONTRATANTE ?? CONTRATADA ser?? paga para pagamento da aquisi????o
                                                                    e deve ser realizada exclusivamente em nome da contratada, atrav??s de transfer??ncias
                                                                    ou dep??sito para a CONTRATADA.
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
                                                                    II.1.	Efetuar o pagamento, ?? CONTRATADA, da quantia devida pela aquisi????o dos produtos/mercadorias,
                                                                    nos termos das cl??usulas 1, 2 e 3 do presente Contrato; VIA CONTA BANC??RIA JURIDICA DA CONTRATADA.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    II.2.	Uma vez realizado o pagamento, os produtos/mercadorias, de acordo com a cl??usula 1,
                                                                    obriga-se a CONTRATANTE a receb??-las da CONTRATADA, que por sua vez a ela se obriga entreg??-las,
                                                                    sob as condi????es pactuadas neste instrumento;
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    <b>III.	RESPONSABILIDADE DA CONTRATADA:</b>
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    III.1.	Efetuar a opera????o de venda dos produtos/mercadorias por encomenda nas condi????es estabelecidas
                                                                    entre a CONTRATADA e a CONTRATANTE, em observ??ncia ?? cl??usula 1;
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    III.2.	Providenciar perante as pessoas jur??dicas respons??veis, tempestivamente, o envio de todos
                                                                    os documentos pertinentes ?? aquisi????o dos produtos/mercadorias.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    III.3.	Responder por eventuais irregularidades dos produtos/mercadorias a serem adquiridos,
                                                                    bem como, responsabilizar-se integralmente pela qualidade e quantidade dos produtos/mercadorias,
                                                                    conferindo-as com as especifica????es conforme negocia????o com os Fornecedor, fisicamente e documentalmente.
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    <b>IV.	PRAZO PARA IMPLEMENTA????O DE SISTEMA</b>
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    IV.1.	O Prazo regulat??rio de entrega do sistema fotovoltaico para conectar a rede s??o de 38 dias ??teis
                                                                    pela concession??ria local, a partir da nova resolu????o 687 ANEEL, por??m, caso a concession??ria aponte obra ou
                                                                    falte medidor, o prazo de entrega ser?? conforme estipulado pela mesma, podendo ser at?? 180 dias.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    IV.2.	Considerando todos tr??mites burocr??ticos de registros na concession??ria de Energia conforme
                                                                    RES 482 Aneel, informado no item.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    IV.3.	O Prazo de CONCLUS??O DA OBRA POR PARTE DA CONTRATADA S??O de at?? 180 dias ap??s a data de pagamento acordado.
                                                                    Tempo de entrega acordados necess??rios para compra de materiais, instala????es, engenharia e tempo de trabalhos necess??rios.
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    <b>V.	GARANTIA DE PRODU????O SFCR</b>
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    Para o sistema fotovoltaico conectado rede (SFCR) ora contratado, ?? garantida a produ????o energ??tica em condi????es
                                                                    ??timas de irradia????o de{` `}
                                                                    <b>
                                                                        {
                                                                            `${prettifyCurrency(
                                                                                ((Number(data.months_average) + Number(data.average_increase)) * 12)
                                                                                    .toFixed(2))} (Quilowatt hora por ano)`
                                                                        }
                                                                    </b>.
                                                                    Entende-se por condi????es ??timas de irradia????o: Pain??is fotovoltaicos alinhados com sua face para o norte, aus??ncia
                                                                    de sujeira acumulada nos pain??is, aus??ncia de sombreamento originado de constru????es ou objetos diversos
                                                                    (exemplo: antenas, condensadores de ar condicionado, muros ou mesmo arvores vizinhas ao local), que possam
                                                                    vir a causar obstru????o na irradia????o solar direta ao longo do dia.
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
                                                                    VI.1 O CONTRANTANTE tem ci??ncia e da pleno aceite a possibilidade de oscila????es m??dias de 5% (cinco por cento)
                                                                    na capacidade estimada de produ????o em Kwh/ano (Quilowatt hora por ano) do sistema fotovoltaico conectado a rede
                                                                    (SFCR) supracitado em virtude de varia????es clim??ticas anuais, considerando a manuten????o da condi????o ??tima de irradia????o.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    VI.2 A CONTRATANTE tem ci??ncia e da pleno aceite ao fato de que podem haver redu????es na produ????o fotovoltaica
                                                                    superiores a 5% (cinco por cento) originadas da inexist??ncia de condi????es ??timas de irradia????o ou por parada
                                                                    do sistema para manuten????o, bem como por constru????es em ??reas vizinhas que venham a bloquear a irradia????o
                                                                    solar direta ou ainda por redu????o da capacidade de gera????o ao longo dos anos, proporcionalmente ao informado
                                                                    pelo fabricante dos pain??is solares utilizados, de maneira que estas redu????es n??o originam nenhum tipo de ressarcimento.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    VI.3 O CONTRATANTE tem ci??ncia e da pleno aceite ?? possiblidade de diferen??a na medi????o de produ????o em KWh/ano
                                                                    entre o sistema fotovoltaico conectado ?? rede (SFCR) e o medidor de energia da concession??ria, sendo utilizado
                                                                    para fins de garantia de produ????o fotovoltaica a medi????o realizada pelo pr??prio INVERSOR do sistema fotovoltaico
                                                                    conectado ?? rede (SFCR) atrav??s de softwares pr??prios do inversor, de terceiros ou no pr??prio display do mesmo.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    VI.4 O CONTRATANTE tem ci??ncia e da pleno aceite que para garantia instant??nea de produ????o energ??tica ??
                                                                    necess??ria rede de internet WIFI dispon??vel para a configura????es do inversor; e caso haja troca da senha
                                                                    de acesso ?? internet haver?? a necessidade de uma visita t??cnica para reconfigura????o do inversor que custar??
                                                                    R$ 100,00 somados a R$ 4,00 o Km quando for necess??rio sair da cidade de {data.store.city} - {data.store.state}.
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    <b>RESCIS??O DO CONTRATO</b>
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    Ap??s o pagamento dos produtos/mercadorias, este contrato passar?? a ser irrevog??vel e irretrat??vel,
                                                                    obrigando ambas as partes em todos os seus termos, atribuindo ao presente Contrato a For??a Executiva,
                                                                    ficando todos os custos adicionais de armazenagem dos produtos/mercadorias, sob inteira responsabilidade
                                                                    da CONTRATANTE.
                                                                </p>

                                                                <p className="text-secondary text-wrap">
                                                                    <b>VALIDADE DO CONTRATO</b>
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    V.1.	Este Contrato ter?? validade por tempo indeterminado, at?? a entrega dos produtos e finaliza????o
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
                                                                    <b>TEMPO DE ENTREGA E INSTALA????ES DO SISTEMA. </b>
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    <b>VI.	ENVIO E CONDI????ES DE ENTREGA.</b><br />
                                                                    VI.1.	Condi????es da entrega: CIF Brasil<br />
                                                                    VI.2.	Incluir um conjunto de documenta????o t??cnica com instru????es, manuten????o,
                                                                    com suas respectivas instru????es de instala????o e uso.<br />
                                                                    VI.3.	Tempo de entrega de at?? 180 dias de instala????o total dos equipamentos.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    <b>VII.	ATRASOS.</b><br />
                                                                    VII.1.	Se a CONTRATADA sofrer qualquer atraso no desempenho devido a causas fora
                                                                    do seu controle, incluindo causas naturais resultantes da lei de Deus, guerra,
                                                                    atos de viol??ncia ou omiss??o por parte dos governos, inc??ndio, desastre, falha
                                                                    de energia, greves, sabotagem ou atraso na obten????o de permiss??es, servi??os,
                                                                    materiais, ferramentas, componentes necess??rios para a instala????o, falta de
                                                                    transporte, a instala????o ser?? alargada a um per??odo de dias iguais ao tempo
                                                                    causado pelo atraso e as suas consequ??ncias.  A CONTRATADA dar?? a CONTRATANTE
                                                                    um aviso num prazo razo??vel a partir da data em que a empresa tem consci??ncia
                                                                    e pleno conhecimento do referido atraso.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    <b>VIII.	LOCAL DA INSTALA????O DO SISTEMA</b><br />
                                                                    VIII.1.	Os m??dulos fotovoltaicos ser??o instalados em ??rea a ser fornecida pelo
                                                                    cliente. Caso seja necess??rio, realiza????o de reformas para altera????o, inclus??o
                                                                    de refor??os ou quaisquer adequa????es necess??rias para a instala????o do sistema,
                                                                    n??o est??o inclu??das nesta proposta, sendo objeto de negocia????o entre as partes,
                                                                    o local estar?? juntamente com a proforma.
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    <b>IX.	GARANTIAS</b><br />
                                                                    IX.1.	Instala????o 1 ano.<br />
                                                                    IX.2.	10 anos de garantia pela fabricante, nos m??dulos fotovoltaicos contra
                                                                    defeito de fabrica????o direto com a f??brica com o interm??dio da contratada, os
                                                                    custos de envio e visita t??cnica por parte da contratante.<br />
                                                                    IX.3.	Garantia de 25 anos pela fabricante dos m??dulos fotovoltaicos relativa a
                                                                    Capacidade de gera????o de energia em at?? 82% de efici??ncia direto com a f??brica.
                                                                    Mas os custos de envio e visita t??cnica por parte da contratante.<br />
                                                                    IX.4.	05 anos de garantia do inversor solar fotovoltaico contra defeito de
                                                                    fabrica????o direto com a f??brica.<br />
                                                                    IX.5.	15 anos de garantia das estruturas de fixa????o
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
                                                                    <b>X.	RESPONSABILIDADE DE INSTALA????O E GARANTIA EM TERRIT??RIO NACIONAL</b><br />
                                                                    X.1.	A CONTRATADA ir?? atuar como vendedora, e efetuar?? instala????o completa
                                                                    do sistema no local indicado pelo CONTRATANTE, bem como dar?? posteriormente o
                                                                    suporte p??s-venda, e manuten????es do sistema dentro da garantia de instala????o em
                                                                    todo o territ??rio nacional com as garantias do sistema no Brasil para o perfeito
                                                                    funcionamento do gerador
                                                                </p>

                                                                <p className="text-secondary ps-5 text-wrap">
                                                                    <b>XI.	ACEITA????O DE CL??USULAS E FINALIZA????O DE CONTRATO</b><br />
                                                                    XI.1.	Desta forma sendo finalizado e formalizada de negocia????es entre as partes
                                                                    CONTRATADA e CONTRATANTE as partes entre si tem aqui acordado de boa-f?? a efetiva????o
                                                                    de neg??cios de bens entre as partes cumprindo integralmente com suas responsabilidade
                                                                    e formalidades legais deste contrato. E, por estarem assim justos e acordados,
                                                                    lavram, datam e assinam o presente instrumento juntamente em 2 (Duas) vias de igual
                                                                    teor e forma, obrigando-se por si.<br />
                                                                    XI.2.	Fica eleito o Foro da comarca de Imperatriz- MA como competente para qualquer
                                                                    a????o judicial oriunda do presente contrato.<br />
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